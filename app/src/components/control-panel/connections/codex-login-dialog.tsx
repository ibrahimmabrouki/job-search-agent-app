"use client";

import { ArrowRight, Clock3, RefreshCw } from "lucide-react";
import type { CodexLogin } from "@/types/control-panel/control-panel.types";
import DialogShell from "../ui/dialog-shell";

type CodexLoginDialogProps = {
  login: CodexLogin;
  busy: boolean;
  statusMessage: string | null;
  onCheck: () => void;
  onClose: () => void;
  onCancel: () => void;
};

export default function CodexLoginDialog({
  login,
  busy,
  onCheck,
  onClose,
  onCancel,
  statusMessage,
}: CodexLoginDialogProps) {
  return (
    <DialogShell
      narrow
      label="Connect OpenAI Codex"
      title="Connect OpenAI Codex"
      help="Authorize Hermes using your existing ChatGPT subscription."
      close={onClose}
    >
      {/* Verification code returned by Hermes */}
      <div className="neon-auth-code" aria-label="Verification code">
        {login.user_code}
      </div>

      <p className="neon-modal-instruction">
        Open the verification page, sign in, and enter this code. Return here to
        check the status.
      </p>

      {/* Display the current login status inside the dialog */}
      {statusMessage && (
        <div className="neon-codex-status" role="status">
          <Clock3 size={17} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main login actions */}
      <div className="neon-modal-actions neon-codex-actions">
        <a
          className="neon-btn subtle"
          href={login.verification_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Verification
          <ArrowRight size={15} />
        </a>

        <button
          type="button"
          className="neon-btn vivid"
          disabled={busy}
          onClick={onCheck}
        >
          <RefreshCw size={15} className={busy ? "neon-spin" : ""} />
          {busy ? "Checking..." : "Check Status"}
        </button>
      </div>

      {/* Cancel the session in Hermes, not just close the dialog */}
      <div className="neon-codex-footer">
        <button
          type="button"
          className="neon-btn subtle"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel Login
        </button>
      </div>
    </DialogShell>
  );
}
