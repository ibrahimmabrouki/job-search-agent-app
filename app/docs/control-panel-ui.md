# Job Search Agent — Coffee Shop Menu structure

## Why this structure

The Coffee Shop Menu repository uses a simple and repeatable path:

`AdminPage → CategoriesManager → category-service.ts → API route → controller → backend service → repository`.

The Job Search Agent now follows that **same file organization and coding style**. Hermes and the WhatsApp Manager are external backends, so their clients take the place of Coffee Shop's database repositories. We do not add an unnecessary browser context, custom feature hooks, generic action executors, or a generic browser API client.

## Files to look at

```text
src/
  app/
    page.tsx                                # Opens the dashboard
    api/v1/...                              # Existing Next.js API endpoints
  components/
    control-panel/
      control-panel-dashboard.tsx           # Render DashboardManager
      dashboard-manager.tsx                 # Load statuses/jobs, dashboard layout, Quick Actions
      dashboard-header.tsx                  # Header and errors, props only
      status-overview.tsx                   # Status cards, props only
      activity-panel.tsx                    # Scheduler activity, props only
      quick-actions.tsx                     # Buttons, props only
      sidebar.tsx                           # Navigation, props only
      connections/
        connections-manager.tsx             # Codex/WhatsApp state and functions
        connections-panel.tsx               # Connection cards
        codex-login-dialog.tsx              # Login dialog
        whatsapp-pairing-dialog.tsx         # Pairing dialog
      scheduler/
        scheduler-manager.tsx               # Job CRUD and actions
        scheduler-list.tsx                  # Job table
        job-dialog.tsx                      # Create/edit form
      workspace/
        workspace-manager.tsx               # Read, save, CV upload
        workspace-panel.tsx                 # File cards
        file-editor-dialog.tsx              # Text editor
      ui/dialog-shell.tsx                   # Shared popup frame
  lib/
    admin-services/
      hermes-service.ts                     # GET /api/v1/status
      codex-service.ts                      # Codex requests
      whatsapp-service.ts                   # WhatsApp requests
      scheduler-service.ts                  # Scheduler requests
      workspace-service.ts                  # Workspace requests
      format.ts                             # Display dates
  server/
    controllers/                             # Existing backend controllers
    services/                                # Existing backend services
    clients/                                 # Existing Hermes/Manager clients
  types/
    control-panel/control-panel.types.ts    # Frontend types
```

## How to debug a failed button (example: WhatsApp Reconnect)

1. Find **`connections-panel.tsx`**. This has the button and calls `beginWhatsAppPairing`.
2. Find **`connections-manager.tsx`**. This contains `handleStartWhatsApp`, catches errors, and reports a message.
3. Find **`lib/admin-services/whatsapp-service.ts`**. This sends `POST /api/v1/whatsapp/connect`.
4. Find **`app/api/v1/whatsapp/connect/route.ts`** and the existing controller/service in `server/`.
5. Inspect the corresponding Manager Bridge and Hermes containers only if the backend request fails.

Everything follows plain React `useState`, `useEffect`, `async/await`, direct `fetch`, and component props, the same approach used by Coffee Shop's `CategoriesManager` and `MenuItemsManager`.

## Important boundaries

- The frontend only calls its own `/api/v1/...` routes, not Docker ports or Hermes credentials.
- Existing server routes/controllers/services/clients are unchanged by this frontend refactor.
- Each feature's manager owns its local UI state; the small dashboard manager only owns shared status/job data, notice display, and Quick Actions.
- Jobs created from the UI start **paused**. We do not trigger jobs without a button press.
- WhatsApp QR rendering is not yet implemented in this branch; pairing data must not go to third-party QR services.
- Scheduler activity is a summary, not a complete Hermes log viewer.
- Test real behavior with `npx tsc --noEmit`, `npm run build`, and UI/API checks after updating the local code. A local type-check against shims is **not** a substitute for a full Next.js build.