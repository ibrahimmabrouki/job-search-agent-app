# Hermes Manager — FastAPI

The **Hermes Manager** is a small Python/FastAPI service embedded in the project's custom Hermes Docker image. It coordinates **WhatsApp self-chat pairing and safe reconnection**; it does not implement the Hermes agent, scheduler or AI search logic.

For the full application, start with the [root README](../../../README.md). For the browser-facing integration, see the [Next.js README](../../../app/README.md).

## Why This Service Exists

Hermes already provides a Gateway, WhatsApp onboarding and a scheduling API. The dashboard needs a controlled way to reconnect WhatsApp without clearing credentials while Hermes or its WhatsApp bridge is still using them.

The Manager concentrates this lifecycle work in one service rather than implementing process and filesystem checks inside the Next.js dashboard.

## Runtime Architecture

~~~text
Browser dashboard (localhost:3000)
         |
         v
Next.js API -> ManagerClient
         |
    localhost:9200
         |
Docker host port -> Manager TCP bridge (:9220)
         |
         v
FastAPI Manager (127.0.0.1:9200 inside gateway container)
         |
         v
Hermes API (127.0.0.1:9119 inside same container)
         |
         +--> Gateway / WhatsApp onboarding
         +--> Persistent session under /opt/data
~~~

**Important:** The Manager is **not a separate Docker container**. It runs alongside Hermes within the custom `job-search-agent` container, supervised by **s6-overlay**. The `hermes-manager-bridge` container only forwards traffic; the second TCP bridge exposes the Hermes API.

The custom Dockerfile pins a Hermes base image by digest and adds this FastAPI service. Docker Compose binds both HTTP APIs to **127.0.0.1** on the host, not to a publicly exposed interface.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Simple Manager health response |
| POST | `/whatsapp/connect` | Start initial pairing or safely prepare reconnection |
| GET | `/whatsapp/poll/{pairing_id}` | Read pairing status and current QR payload |
| POST | `/whatsapp/apply/{pairing_id}` | Apply a confirmed pairing and verify readiness |

These are Manager endpoints, reached at **http://127.0.0.1:9200** when running locally. The browser normally uses Next.js `/api/v1/whatsapp/*` routes instead of calling them directly.

There is **no separate `/whatsapp/reconnect` endpoint**. `connect` chooses the initial-connect or reconnect path based on existing session credentials. A dashboard-level disconnect route is not currently implemented.

## WhatsApp Lifecycle

### First connection

1. `POST /whatsapp/connect` requests Hermes self-chat onboarding.
2. Hermes returns a pairing ID; the frontend polls `/whatsapp/poll/{pairing_id}` and displays QR payloads using the local QR component.
3. After the phone scans a valid QR, polling reports `connected`.
4. `POST /whatsapp/apply/{pairing_id}` applies configuration through Hermes, waits for healthy Gateway/WhatsApp status and configures the authenticated account as the self-chat home channel.

### Reconnection and safety

If an existing session is present, the Manager:

1. Acquires a filesystem lock to prevent concurrent connection operations.
2. Captures the WhatsApp bridge process identity.
3. Requests Hermes Gateway shutdown and waits for a **verified stopped state**.
4. Checks bridge exit, including PID reuse and zombie-process handling; also rejects a still-running bridge or lingering PID file.
5. Only then removes the old session and requests a fresh pairing.

**Fail closed:** If Gateway or bridge shutdown cannot be established safely, the Manager raises an error and **preserves existing session credentials** instead of attempting unsafe cleanup.

## Source Layout

~~~text
docker/hermes/
├── Dockerfile                     # Custom pinned Hermes image
├── s6/manager/run                 # Launch FastAPI under s6
└── manager/
    ├── app/
    │   ├── main.py               # Application factory
    │   ├── api/
    │   │   ├── router.py         # Shared API router
    │   │   └── routes/
    │   │       ├── health.py
    │   │       └── whatsapp.py
    │   ├── core/config.py        # Hermes URL and token configuration
    │   ├── schemas/whatsapp.py   # Pydantic response models
    │   └── services/whatsapp_service.py
    └── tests/integration/
        ├── test_reconnect_safety.py
        └── test_reconnect_flow.py
~~~

The FastAPI application uses the Python dependencies installed by the pinned Hermes image; no standalone Manager dependency manifest is currently provided.

## Build and Run (Windows / PowerShell)

From the repository root, configure the Hermes session token as described in the [main setup instructions](../../../README.md#run-locally-windows--powershell). Then run:

~~~powershell
cd C:\projects\job-search-agent-app
docker build -t job-search-agent-hermes:dev .\docker\hermes
docker compose up -d
docker compose ps
~~~

Check the Manager health endpoint:

~~~powershell
Invoke-RestMethod http://127.0.0.1:9200/health
~~~

Expected shape: `ok: true` and `service: hermes-manager`. The dashboard and its WhatsApp lifecycle controls are in the separate Next.js application.

## Tests

The following tests use Python `unittest` and mocks to exercise safety logic **without initiating a real reconnection**:

~~~powershell
docker exec -e PYTHONPATH=/opt/hermes-manager -w /opt/hermes-manager job-search-agent /opt/hermes/.venv/bin/python tests/integration/test_reconnect_safety.py

docker exec -e PYTHONPATH=/opt/hermes-manager -w /opt/hermes-manager job-search-agent /opt/hermes/.venv/bin/python tests/integration/test_reconnect_flow.py
~~~

They cover Gateway state checks, bridge process detection (missing, running, zombie and reused PID), required reconnect order, and preservation of credentials on shutdown failures. They are **targeted tests**, not a claim of full end-to-end coverage.

Avoid running the separate live pairing demonstration script (`test_whatsapp_service.py`) on an active connected account without deliberately planning a reconnection.

## Security and Limitations

- Session tokens are provided through Docker environment configuration; do not put tokens into source code or logs.
- The Manager and Hermes APIs are host-local. This is a **local development service**, not a hardened public multi-user API.
- WhatsApp self-chat is the supported mode; separate bot-number operation is out of scope.
- The Manager's default Swagger/ReDoc endpoints are disabled.
- Pairing state/QR payloads should not be sent to third-party services or committed to the repository.
- Runtime sessions and credentials live under Hermes' persistent `/opt/data` volume. Never publish the volume, the CV, or WhatsApp credentials.
