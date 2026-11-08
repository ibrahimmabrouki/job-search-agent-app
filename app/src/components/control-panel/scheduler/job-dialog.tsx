"use client";

import { Check } from "lucide-react";
import type { JobEditorState, JobForm } from "@/types/control-panel/control-panel.types";
import DialogShell from "../ui/dialog-shell";

export default function JobDialog({ editor, busy, onClose, onChange, onSave }: {
  editor: JobEditorState;
  busy: boolean;
  onClose: () => void;
  onChange: (form: JobForm) => void;
  onSave: () => Promise<void>;
}) {
  const { form, id } = editor;
  return <DialogShell narrow label={id ? "Edit scheduled job" : "Create scheduled job"}
    title={id ? "Edit Job" : "Create Job"}
    help={id ? "Update this job's schedule and instructions." : "New jobs start paused so nothing executes unexpectedly."}
    close={onClose}>
    <form className="neon-form" onSubmit={event => { event.preventDefault(); void onSave(); }}>
      <label>Job name<input required value={form.name} maxLength={120}
        onChange={event => onChange({ ...form, name: event.target.value })}/></label>
      <label>Schedule<input required value={form.schedule} placeholder="every 24h"
        onChange={event => onChange({ ...form, schedule: event.target.value })}/></label>
      <label>Delivery<select value={form.deliver}
        onChange={event => onChange({ ...form, deliver: event.target.value as JobForm["deliver"] })}>
        <option value="whatsapp">WhatsApp</option><option value="local">Local</option>
      </select></label>
      <label>Prompt<textarea required rows={5} value={form.prompt}
        onChange={event => onChange({ ...form, prompt: event.target.value })}/></label>
      <div className="neon-modal-actions">
        <button type="button" className="neon-btn subtle" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={busy} className="neon-btn vivid"><Check size={16}/> Save Job</button>
      </div>
    </form>
  </DialogShell>;
}