# Control Panel — Frontend Architecture and Request Flow

This guide describes the **implemented** Next.js dashboard of [Job Search Agent](../../../README.md). For installation and environment configuration, see [app/README.md](../README.md). For the WhatsApp backend lifecycle, see the [FastAPI Manager README](../../../docker/hermes/manager/README.md).

## Why This Structure?

The application keeps each responsibility in a predictable layer:

```text
Browser UI component
  -> Client-side admin service (fetch)
  -> Next.js API route
  -> Controller
  -> Application service
  -> HermesClient or ManagerClient
  -> Dockerized Hermes / FastAPI Manager
```

**Why:** React components shouldn't need to know upstream ports, authentication headers, error mapping, or filesystem rules. API and backend layers can change independently of the dashboard.

## Main Source Files

```text
app/src/
├── app/
│   ├── page.tsx                        # Renders DashboardManager
│   ├── layout.tsx                      # Root shell and font
│   ├── globals.css                     # Theme and typography
│   └── api/v1/                         # Server-side HTTP endpoints
├── components/control-panel/
│   ├── dashboard-manager.tsx           # Shared status/jobs, layout
│   ├── dashboard-header.tsx            # Header, notices and refresh
│   ├── sidebar.tsx                     # Navigation
│   ├── status-overview.tsx             # Status cards
│   ├── activity-panel.tsx              # Scheduler run summaries
│   ├── quick-actions.tsx               # Common UI actions
│   ├── primitives.tsx                  # Reusable status/heading elements
│   ├── connections/
│   │   ├── connections-manager.tsx     # Codex and WhatsApp flow state
│   │   ├── connections-panel.tsx       # Integration controls
│   │   ├── codex-login-dialog.tsx
│   │   ├── whatsapp-pairing-dialog.tsx
│   │   └── whatsapp-qr-code.tsx        # Local QR rendering
│   ├── scheduler/
│   │   ├── scheduler-manager.tsx       # Job operations and forms
│   │   ├── scheduler-list.tsx          # Job table
│   │   └── job-dialog.tsx
│   ├── workspace/
│   │   ├── workspace-manager.tsx       # File actions and editor state
│   │   ├── workspace-panel.tsx         # Files overview
│   │   └── file-editor-dialog.tsx
│   └── ui/dialog-shell.tsx             # Shared dialog shell
├── lib/admin-services/                # Browser-to-Next.js API helpers
├── server/
│   ├── controllers/                    # Route-level delegation
│   ├── services/                       # Feature operations
│   ├── clients/hermes/                 # Authenticated Hermes requests
│   ├── clients/manager/                # FastAPI Manager requests
│   ├── config/env.ts                   # Server configuration
│   └── errors/                         # Structured upstream error handling
└── types/                              # TypeScript data contracts
```

## Example: WhatsApp Connection

1. The user selects **Connect** or **Reconnect** in `connections-panel.tsx`.
2. `connections-manager.tsx` manages UI state and calls `lib/admin-services/whatsapp-service.ts`.
3. The browser calls the Next.js `/api/v1/whatsapp/connect` route, which delegates to the WhatsApp controller/service and `ManagerClient`.
4. The FastAPI Manager starts onboarding or safely prepares reconnection using Hermes.
5. The UI polls `/api/v1/whatsapp/poll/{pairingId}` for status and QR payload.
6. `whatsapp-qr-code.tsx` displays that payload locally using `qrcode.react`; the QR payload does **not** need a third-party image-generation service.
7. After scanning, the user applies pairing through `/api/v1/whatsapp/apply/{pairingId}`. The Manager verifies readiness and configures the self-chat destination.

The browser does not directly use the Hermes session token. The Manager is responsible for validating Gateway and WhatsApp bridge shutdown before any reconnect session cleanup.

## Example: Creating a Scheduled Job

`scheduler-list.tsx` -> `scheduler-manager.tsx` -> `lib/admin-services/scheduler-service.ts` -> `/api/v1/scheduler/jobs` -> scheduler controller/service -> `HermesClient` -> Hermes Cron API.

New jobs are sent with `paused: true`. Users can explicitly resume or trigger jobs later. The dashboard exposes create, edit, pause, resume, and trigger actions. The shared recent-activity panel displays last-run summaries rather than a full Hermes execution log.

## Example: Workspace Editing

`workspace-panel.tsx` -> `workspace-manager.tsx` -> `lib/admin-services/workspace-service.ts` -> `/api/v1/workspace/*` -> workspace controller/service -> `HermesClient` -> persistent Hermes workspace.

The backend chooses fixed paths for `AGENTS.md`, `PROFILE.md`, and the CV PDF. CV uploads are validated for PDF MIME type, file size and PDF signature. `job_history.json` is agent-managed and not currently editable from the dashboard.

## Important Boundaries and Limitations

- Next.js runs on the host; Hermes, Manager and two TCP bridge containers run in Docker.
- User-facing React code calls same-origin API routes. Protected upstream calls stay on the server.
- `MANAGER_BASE_URL` is the environment key actually consumed by the backend. The tracked `app/.env.example` currently uses a stale `HERMES_MANAGER_URL` key, so use the correct key in `app/.env.local`.
- The `qrcode.react` dependency is currently declared in the repository root `package.json`, not in `app/package.json`. Run root and app `npm install` steps as described in the README.
- Agent start/stop/restart routes and the WhatsApp disconnect route are **placeholders**, not working controls.
- `activity-panel.tsx` shows scheduler status summaries, not complete runtime logs.
- The current application is a local development system; do not expose its management APIs publicly.

## Verification

From `app`:

```powershell
npx tsc --noEmit
npm run build
```

Also test a live dashboard session against a running Docker Compose stack. A passing type check does not establish successful WhatsApp pairing or scheduled execution.

For reconnect safety test commands, refer to the [FastAPI Manager README](../../../docker/hermes/manager/README.md#tests).
