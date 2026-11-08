"use client";

import { CloudUpload, Play, Plus, UserRound, Zap } from "lucide-react";


export function QuickActions({ selectedJobId, busy, onTriggerJob, onCreateJob, onUploadCv, onEditProfile }: {
  selectedJobId: string;
  busy: boolean;
  onTriggerJob: () => Promise<void>;
  onCreateJob: () => void;
  onUploadCv: () => void;
  onEditProfile: () => void;
}) {
  return <section id="settings" className="neon-panel neon-quick">
    <div className="neon-quick-label"><Zap size={25}/><div><h2>Quick Actions</h2><p>Common tasks to manage your job-search agent.</p></div></div>
    <div className="neon-quick-actions">
      <button type="button" className="neon-quick-btn primary" disabled={!selectedJobId || busy}
        onClick={() => void onTriggerJob()}><Play size={27} fill="currentColor"/>
        <span><strong>Trigger Job</strong><small>Run the selected job</small></span></button>
      <button type="button" className="neon-quick-btn" onClick={onCreateJob}><Plus size={27}/><span><strong>Create Job</strong><small>Set up a new schedule</small></span></button>
      <button type="button" className="neon-quick-btn" disabled={busy} onClick={onUploadCv}>
        <CloudUpload size={27}/><span><strong>Upload CV</strong><small>Replace your resume PDF</small></span></button>
      <button type="button" className="neon-quick-btn" disabled={busy} onClick={onEditProfile}>
        <UserRound size={27}/><span><strong>Edit Profile</strong><small>Update your preferences</small></span></button>
    </div>
  </section>;
}