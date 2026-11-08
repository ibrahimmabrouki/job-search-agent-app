// This file is build in order to define the types for Whatsapp API responses and requests
// These types are going to be used when we want to make a cleaner and more structured code for the Whatsapp API integration

// -----------------------------------------------------------------------------
// Whatsapp API types
// -----------------------------------------------------------------------------

// For the Whatsapp Status API Instead of exposing the entire response of api/status
// Our backend endpoint GET /api/v1/whatsapp/status will only return the Whatsapp information
export type WhatsAppStatus = {
  connected: boolean;
  state: string;
  needsAttention: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: string;
};
// connected — easy boolean for the UI. true when WhatsApp is connected.
// state — Hermes' actual state, currently "disconnected".
// needsAttention — tells the UI whether the user should take action.
// errorCode — machine-readable Hermes error if one exists.
// errorMessage — human-readable error if something went wrong.
// updatedAt — when Hermes last updated this platform state.

export type WhatsAppConnectResponse = {
  pairing_id: string;
  status: string;
  qr_payload: string | null;
  expires_at: string;
  mode: string;
  allowed_users: string;
  account_id: string | null;
  account_name: string | null;
  account_phone: string | null;
  error: string | null;
};

// pairing_id
// → temporary onboarding/pairing session ID

// status
// → current pairing result, here "connected"

// qr_payload
// → QR data if a QR scan is required
// → empty here because Hermes was already connected

// expires_at
// → when this temporary pairing session expires

// mode
// → connection mode, here "self-chat"

// allowed_users
// → extra WhatsApp users allowed to interact with the agent
// → empty in our setup

// account_id
// → Hermes/WhatsApp internal account identifier

// account_name
// → connected WhatsApp display name

// account_phone
// → connected WhatsApp phone number

// error
// → pairing error if something fails
// → empty here


export type WhatsAppApplyResponse = {
  ok: boolean;
  platform: "whatsapp";
  needs_restart: boolean;
  restart_started: boolean;
  restart_action: string | null;
  restart_pid: number | null;

  // Manager verifies the live connection after applying.
  gateway_ready: boolean;
  whatsapp_connected: boolean;

  // Manager automatically configures the self-chat destination.
  home_channel: string | null;
  home_channel_configured: boolean;
};

// What the fields mean:
// - ok → whether Hermes successfully applied the pairing
// - platform → confirms this apply operation was for WhatsApp
// - needs_restart → whether a restart is required
// - restart_started → whether Hermes already started that restart itself
// - restart_action → the restart action Hermes triggered, such as "gateway-restart"
// - restart_pid → process ID related to the restart, if available

export type WhatsAppPollResponse = {
  pairing_id: string;
  status: string;
  qr_payload: string | null;
  expires_at: string;
  mode: string;
  allowed_users: string;
  account_id: string | null;
  account_name: string | null;
  account_phone: string | null;
  error: string | null;
};

export type WhatsAppCancelResponse = {
  ok: boolean;
};