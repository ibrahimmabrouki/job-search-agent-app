import "server-only";

import { createCodexService } from "@/server/services/codex/codex.service";
import type {
  CodexStatus,
  CodexLoginStartResponse,
  CodexLoginPollResponse,
  CodexLoginCancelResponse,
  CodexDisconnectResponse,
} from "@/types/codex/condex.types";

// Controller for Codex-related API operations.
//
// The controller does not talk to Hermes directly.
// It delegates the actual feature logic to CodexService.

export const getCodexStatus = async (): Promise<CodexStatus> => {
  const codexService = createCodexService();

  return codexService.getStatus();
};

// This is the controller that instiates the CodexService and uses the startLogin() method to initiate the login process for the OpenAI Codex provider.
export const startCodexLogin = async (): Promise<CodexLoginStartResponse> => {
  const codexService = createCodexService();

  return codexService.startLogin();
};

// This is the controller that instantiates the CodexService and uses the pollLogin() method to check the login status of the user for the OpenAI Codex provider.
export const pollCodexLogin = async (
  sessionId: string,
): Promise<CodexLoginPollResponse> => {
  const codexService = createCodexService();

  return codexService.pollLogin(sessionId);
};

// This is the controller that instantiates the CodexService and uses the cancelLogin() method to cancel the login process for the OpenAI Codex provider.
export const cancelCodexLogin = async (
  sessionId: string,
): Promise<CodexLoginCancelResponse> => {
  const codexService = createCodexService();

  return codexService.cancelLogin(sessionId);
};

// This is the controller that instantiates the CodexService and uses the disconnect() method to disconnect the OpenAI Codex provider.
export const disconnectCodex = async (): Promise<CodexDisconnectResponse> => {
  const codexService = createCodexService();

  return codexService.disconnect();
};
