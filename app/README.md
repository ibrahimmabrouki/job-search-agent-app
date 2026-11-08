# Next.js Control Panel

The Next.js application is the **local dashboard and server-side API layer** for [Job Search Agent](../README.md). It is not a frontend-only prototype: its dashboard and supported controls communicate with the Dockerized Hermes API and the custom FastAPI Manager.

> Current deployment: the dashboard runs on the host at **http://localhost:3000**. Hermes, the FastAPI Manager, and two TCP bridge containers run in Docker. Dockerizing the Next.js application and providing a one-click launcher are future plans.

## Features

- **System overview:** Hermes Gateway, OpenAI Codex, WhatsApp, scheduler, and workspace status.
- **Connections:** Codex authentication (start, poll, cancel, disconnect) and WhatsApp self-chat QR pairing (connect/reconnect, poll, apply, cancel pairing).
- **Workspace:** Edit the agent instructions (`AGENTS.md`) and profile (`PROFILE.md`); upload/replace a PDF CV.
- **Scheduler:** Create, edit, pause, resume, and manually trigger jobs. Newly created jobs are **paused by default**.
- **Activity and quick actions:** Scheduler run summaries and shortcuts for available workspace and scheduler operations.

**Not yet implemented:** dashboard-level agent start/stop/restart API operations, a full Hermes runtime log viewer, and editing the agent-managed job history. Some existing API route files are placeholders; do not treat their presence as functional endpoints.

## Architecture

~~~text
Browser / React dashboard
        |
        v
Client-side admin services (fetch)
        |
        v
Next.js /api/v1/* route handlers
        |
        v
Controllers -> Application services
        |
        +--> HermesClient  -> Hermes HTTP API (localhost:9119)
        |
        +--> ManagerClient -> FastAPI Manager (localhost:9200)
                              -> Hermes WhatsApp onboarding
~~~

The browser calls **same-origin API routes**, not Hermes directly. Server-only clients read the Hermes token from environment variables, centralize upstream HTTP requests, and handle timeouts and errors. The FastAPI Manager handles infrastructure-sensitive WhatsApp lifecycle operations.

## Code Organization

| Path | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Entry point that renders the dashboard |
| `src/app/layout.tsx`, `src/app/globals.css` | Application shell and typography/theme |
| `src/components/control-panel/dashboard-manager.tsx` | Shared dashboard state, status loading, navigation |
| `src/components/control-panel/{sidebar,dashboard-header,status-overview,activity-panel,quick-actions}.tsx` | Presentational sections |
| `src/components/control-panel/connections/` | Codex and WhatsApp connection workflows and dialogs |
| `src/components/control-panel/scheduler/` | Scheduler management, job table, create/edit dialog |
| `src/components/control-panel/workspace/` | Workspace editing and CV upload |
| `src/lib/admin-services/` | Browser-side wrappers around application API routes |
| `src/app/api/v1/` | Next.js HTTP route handlers |
| `src/server/controllers/` | HTTP-to-service orchestration |
| `src/server/services/` | Feature logic and Hermes/Manager operations |
| `src/server/clients/` | Reusable authenticated upstream HTTP clients |
| `src/server/config/env.ts` | Server-side environment configuration |

A more detailed UI request trace is in [docs/control-panel-ui.md](docs/control-panel-ui.md).

## Main API Groups

| Prefix | Purpose |
| --- | --- |
| `/api/v1/status` | Hermes system status |
| `/api/v1/codex/*` | Codex connection and authentication lifecycle |
| `/api/v1/whatsapp/*` | WhatsApp status, pairing, reconnect and cancellation flows |
| `/api/v1/scheduler/*` | Scheduler status, jobs and execution actions |
| `/api/v1/workspace/*` | Agent instructions, candidate profile and CV upload |

**Limitations:** The WhatsApp `disconnect` route and the `agent/start`, `agent/stop`, and `agent/restart` routes are currently placeholders. Scheduler activity shows recent job status, not complete Hermes logs.

## Run Locally (Windows / PowerShell)

Prerequisites: **Docker Desktop**, **Node.js/npm**, and **Git**. Follow the [root setup guide](../README.md#run-locally-windows--powershell) to configure and start Hermes and its Manager before starting the dashboard.

From the repository root, install the currently declared root-level QR dependency, then install the frontend dependencies:

~~~powershell
cd C:\projects\job-search-agent-app
npm install
cd app
npm install
Copy-Item .env.example .env.local
notepad .env.local
~~~

Set `app/.env.local` to use the **same Hermes session token** as the root `.env`:

~~~dotenv
HERMES_BASE_URL=http://127.0.0.1:9119
MANAGER_BASE_URL=http://127.0.0.1:9200
HERMES_DASHBOARD_SESSION_TOKEN=replace_with_your_actual_token
~~~

**Important current setup details:**

- The tracked `app/.env.example` still calls the Manager setting `HERMES_MANAGER_URL`; the implemented server reads `MANAGER_BASE_URL`. Use the name shown above.
- The QR component imports `qrcode.react`, which is currently declared in the **repository-root** `package.json`, not `app/package.json`. That is why this setup installs root dependencies as well. Relocating the dependency is future cleanup, not yet completed.
- Never commit `.env`, `.env.local`, auth tokens, WhatsApp pairing data or candidate files.

Start the dashboard:

~~~powershell
npm run dev
~~~

Open **http://localhost:3000**. Stop with **Ctrl+C**. Docker services are managed separately from the repository root with `docker compose`.

## Development Checks

From the `app` directory:

~~~powershell
npx tsc --noEmit
npm run build
~~~

These commands check TypeScript and the Next.js build; they are not a replacement for testing real integrations against running Hermes and Manager services.

## Design and Reliability Choices

- Plain React state and feature-specific manager components keep the UI understandable without a large state-management framework.
- Separate client wrappers, API routes, controllers and services keep infrastructure concerns out of React components.
- Concurrent dashboard status requests are handled independently, so one failing upstream does not hide available statuses.
- Server-only Hermes credentials, fixed workspace paths and CV PDF validation support safer local operation.
- Loading/disabled states discourage conflicting actions while an operation is in progress.

For Docker and WhatsApp process safety, see the [FastAPI Manager README](../docker/hermes/manager/README.md).
