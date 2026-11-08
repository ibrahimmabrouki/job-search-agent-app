# Job Search Agent UI Starter

A clean, local-only control panel starter for the Dockerized Job Search Agent.

## What this version includes

- Single-page dashboard — no sidebar, no account/login/logout UI.
- Light green modern theme and responsive layout.
- System status cards for Hermes, Codex, WhatsApp, and Scheduler.
- Codex + WhatsApp connection cards, including future Disconnect actions.
- Agent configuration area for `AGENTS.md`, `PROFILE.md`, and `CV.pdf`.
- Scheduler controls.
- Agent runtime controls.
- Recent activity/log preview.
- Production-friendly component structure and TypeScript.

## Important

This is intentionally **frontend-only**. Buttons are visual placeholders. We will wire them to the Hermes HTTP API and Dockerized application backend during the next development phase.

## Start locally

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Suggested integration structure later

```text
Browser
  ↓
Next.js UI + API routes
  ↓
Controllers / services
  ↓
Hermes HTTP API
  ↓
Hermes Gateway / Codex / WhatsApp / Cron
```

The Docker Compose phase can add this app as a second service beside the Hermes gateway.
