"use client";

import { Check, CheckCircle2, RefreshCw } from "lucide-react";
import type { WhatsAppPairing } from "@/types/control-panel/control-panel.types";
import WhatsAppQRCode from "./whatsapp-qr-code";
import DialogShell from "../ui/dialog-shell";

type WhatsAppPairingDialogProps = {
  pairing: WhatsAppPairing;
  pollingError: string | null;
  busy: boolean;
  onPoll: () => void;
  onApply: () => void;
  onClose: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

export default function WhatsAppPairingDialog({
  pairing,
  pollingError,
  busy,
  onPoll,
  onApply,
  onClose,
  onCancel,

  // The onRetry prop is a callback function that is triggered in the following scenario:
  // 1- User clicks Connect WhatsApp.
  // 2- The QR code appears, but the user doesn't scan it.
  // 3- The pairing session expires.
  // 4-The dialog displays an expiration error.
  // 5- The user clicks the "Try Again" button.

  // Without this the user needs to close the dialog and tirggers the Recconnect or Connect button again to start a new pairing session.
  onRetry,
}: WhatsAppPairingDialogProps) {
  const isConnected = pairing.status === "connected";
  const canRetry = ["expired", "error", "cancelled"].includes(pairing.status);
  const hasQRCode = Boolean(pairing.qr_payload);

  return (
    <DialogShell
      narrow
      label="Connect WhatsApp"
      title="WhatsApp Self-Chat"
      help={`Pairing status: ${pairing.status}`}
      close={onClose}
    >
      {/* Display QR code when available and pairing is not complete 
      Note that we added the !canRetry since when it is true, we don't want to display the QR code. */}
      {!isConnected && !canRetry && hasQRCode && pairing.qr_payload && (
        <>
          <p className="neon-modal-instruction">
            Open WhatsApp on your phone, go to Linked Devices, select Link a
            Device, and scan this QR code.
          </p>

          <WhatsAppQRCode payload={pairing.qr_payload} />
        </>
      )}

      {/* Display a waiting message while the QR is being prepared */}
      {!isConnected && !canRetry && !hasQRCode && !pairing.error && (
        <p className="neon-modal-instruction">
          Preparing your WhatsApp pairing session. Click Poll Status to check
          for the QR code.
        </p>
      )}

      {/* Display confirmation when WhatsApp pairing succeeds */}
      {isConnected && (
        <div className="neon-pairing-ready" role="status">
          <CheckCircle2 size={19} />
          WhatsApp pairing successful. Click Apply Connection to activate it.
        </div>
      )}

      {/* Display errors returned by the backend */}
      {pairing.error && (
        <p className="neon-modal-error" role="alert">
          {pairing.error}
        </p>
      )}

      {/* Display temporary polling errors without ending the session */}
      {pollingError && (
        <p className="neon-modal-error" role="status">
          {pollingError}
        </p>
      )}

      {/* Pairing actions */}
      {/* Reuse the Codex action layout for equally sized buttons */}
      <div className="neon-modal-actions neon-codex-actions">
        {canRetry ? (
          <button
            type="button"
            className="neon-btn subtle"
            disabled={busy}
            onClick={onRetry}
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        ) : (
          <button
            type="button"
            className="neon-btn subtle"
            disabled={busy || isConnected}
            onClick={onPoll}
          >
            <RefreshCw size={15} className={busy ? "neon-spin" : ""} />
            Poll Status
          </button>
        )}

        <button
          type="button"
          className="neon-btn vivid"
          disabled={busy || !isConnected}
          onClick={onApply}
        >
          <Check size={15} />
          Apply Connection
        </button>
      </div>

      {/* Separate cancellation from the main pairing actions,
          just like the Codex login dialog */}
      <div className="neon-codex-footer">
        <button
          type="button"
          className="neon-btn subtle"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel Pairing
        </button>
      </div>
    </DialogShell>
  );
}
