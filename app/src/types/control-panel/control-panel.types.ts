/** Client-facing projections of the existing Next.js API responses. */
// It tells TypeScript what properties and data types we expect from the backend.

// 3. Why does the backend type contain more properties?
// Our backend has a more detailed HermesStatus type in:

// src/types/hermes/hermes.types.ts

// It includes additional information about gateway platforms, components, and other system details.

// Our frontend type currently describes only five properties needed by the UI.

// Important: This does not mean the backend removes the other properties. The frontend can receive the complete JSON response.
export type HermesStatus = {
  version: string;
  gateway_running: boolean;
  gateway_state: string;
  overall: string;
  active_sessions: number;
};
export type CodexStatus = {
  connected: boolean;
  provider: string;
  source: string | null;
};
export type WhatsAppStatus = {
  connected: boolean;
  state: string;
  errorMessage?: string | null;
};

export type CronJob = {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
  state: string;
  schedule_display: string;
  deliver: string;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
};
export type EditableFile = "agents" | "profile";
export type FileEditorState = {
  type: EditableFile;
  title: string;
  content: string;
};
export type JobForm = {
  name: string;
  schedule: string;
  prompt: string;
  deliver: "whatsapp" | "local";
};
export type JobEditorState = { id?: string; form: JobForm };

// This type represents the information returend by the Next.js backend when a user initiates a Codex login session
// session_id:	Identifies the login attempt so we can check its status
// verification_url:	Page where the user authorizes Codex
// user_code:	Code the user enters on that page
export type CodexLogin = {
  session_id: string;
  verification_url: string;
  user_code: string;
  expires_in: number;
};
export type WhatsAppPairing = {
  pairing_id: string;
  status: string;
  qr_payload: string | null;
  expires_at: string;
  error: string | null;
};
export type Notice = { text: string; kind: "ok" | "error" };
export const NEW_JOB: JobForm = {
  name: "",
  schedule: "every 24h",
  prompt: "",
  deliver: "whatsapp",
};
