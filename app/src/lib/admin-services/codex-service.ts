// This file contains the methods that interact with the Next.js API endpoints related to the Codex service.

import type {
  CodexLogin,
  CodexStatus,
} from "@/types/control-panel/control-panel.types";

export type CodexPollResult = { status: string; error_message: string | null };

// Send a POST request to our Next.js backend.
// Read the JSON response.
// Throw an error if the request fails.
// Return the login information if successful.
export async function getCodexStatus(): Promise<CodexStatus> {
  const response = await fetch("/api/v1/codex/status", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to load Codex status");

  // For example, a successful response could look like:
  // { "session_id": "session-123",
  //   "verification_url": "https://example.com/verify",
  //   "user_code": "ABCD-1234" }
  return data as CodexStatus;
}

export async function startCodexLogin(): Promise<CodexLogin> {
  const response = await fetch("/api/v1/codex/login", {
    method: "POST",
    credentials: "same-origin",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to start Codex login");
  return data as CodexLogin;
}

export async function pollCodexLogin(
  sessionId: string,
): Promise<CodexPollResult> {
  const response = await fetch(
    `/api/v1/codex/poll/${encodeURIComponent(sessionId)}`,
    { credentials: "same-origin", cache: "no-store" },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to check Codex login");
  return data as CodexPollResult;
}

export async function disconnectCodex(): Promise<void> {
  const response = await fetch("/api/v1/codex/disconnect", {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Unable to disconnect Codex");
  }
}

export async function cancelCodexLogin(sessionId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/codex/cancel/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const data = await response.json();

    throw new Error(data.error?.message || "Unable to cancel Codex login");
  }
}
