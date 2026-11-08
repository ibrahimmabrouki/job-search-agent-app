"use client";

import { Check } from "lucide-react";
import type { FileEditorState } from "@/types/control-panel/control-panel.types";
import DialogShell from "../ui/dialog-shell";

export default function FileEditorDialog({
  file,
  busy,
  onChange,
  onClose,
  onSave,
}: {
  file: FileEditorState;
  busy: boolean;
  onChange: (content: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  return (
    <DialogShell
      label={`Edit ${file.title}`}
      title={file.title}
      help="Save updates directly to the persistent Hermes workspace."
      close={onClose}
    >
      <label htmlFor="agent-file-content" className="sr-only">
        File content
      </label>
      <textarea
        id="agent-file-content"
        className="neon-editor"
        spellCheck={false}
        value={file.content}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="neon-modal-actions">
        <button type="button" className="neon-btn subtle" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="neon-btn vivid"
          disabled={busy}
          onClick={() => void onSave()}
        >
          <Check size={16} /> Save Changes
        </button>
      </div>
    </DialogShell>
  );
}
