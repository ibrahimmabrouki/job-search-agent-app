// Types used by the Codex / OpenAI OAuth integration.
//
// Hermes handles the actual OAuth communication with OpenAI.
// Our application talks to Hermes and receives structured responses
// describing the authentication process.

// -----------------------------------------------------------------------------
// Codex provider status
// -----------------------------------------------------------------------------
//
// Represents the authentication state of the OpenAI Codex provider.
//
// We already observed that Hermes exposes information such as:
//
// provider id      → "openai-codex"
// provider name    → "ChatGPT or Codex Subscription"
// OAuth flow       → "device_code"
// logged-in state  → true / false
//
// We intentionally model only the fields our application needs.

export type CodexProviderStatus = {
  id: string;
  name: string;
  flow: string;

  status: {
    logged_in: boolean;
    source_label?: string | null;
  };
};

// -----------------------------------------------------------------------------
// Start-login response
// -----------------------------------------------------------------------------
//
// Returned when we ask Hermes to start the Codex OAuth process.
//
// Hermes creates a temporary OAuth session and gives us:
//
// - session_id
// - user_code
// - verification_url
// - expiry information
// - polling interval
//
// The UI will eventually display the user_code and verification URL.

export type CodexLoginStartResponse = {
  session_id: string;

  flow: "device_code";

  user_code: string;
  verification_url: string;

  expires_in: number;
  poll_interval: number;
};

// -----------------------------------------------------------------------------
// OAuth polling state
// -----------------------------------------------------------------------------
//
// After starting login, our backend periodically asks Hermes:
//
// "Has this OAuth session completed yet?"

export type CodexLoginPollResponse = {
  session_id: string;
  status: string;
  error_message: string | null;
  expires_at: number;
  reason: string | null;
  account_email: string | null;
  model: string | null;
  retryable: boolean | null;
  retry_after: number | null;
};

// -----------------------------------------------------------------------------
// Application-facing Codex status
// -----------------------------------------------------------------------------
//
// This is a simpler shape that our own application can eventually expose
// to the frontend.
//
// The frontend does not need every detail returned internally by Hermes.
// It mainly needs to know whether Codex is connected.

export type CodexStatus = {
  connected: boolean;
  provider: "openai-codex";
  source?: string | null;
};

export type CodexLoginCancelResponse = {
  ok: boolean;
  session_id: string;
};

export type CodexDisconnectResponse = {
  ok: boolean;
  provider: "openai-codex";
};