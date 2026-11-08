"use client";

import { MessageCircleMore, PlugZap, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";

export function ConnectionsSection() {
  return (
    <SectionCard title="Connections" description="Connect the two services this agent needs.">
      <div className="connection-grid">
        <article className="connection-card">
          <div className="connection-icon"><Sparkles size={24} /></div>
          <div className="connection-content">
            <div className="connection-title-row"><h3>Codex</h3><StatusPill state="connected" /></div>
            <p>Uses your ChatGPT/Codex subscription for the agent model.</p>
            <div className="button-row">
              <button className="btn btn-secondary" type="button">Reconnect</button>
              <button className="btn btn-quiet" type="button">Disconnect</button>
            </div>
          </div>
        </article>
        <article className="connection-card">
          <div className="connection-icon whatsapp"><MessageCircleMore size={24} /></div>
          <div className="connection-content">
            <div className="connection-title-row"><h3>WhatsApp</h3><StatusPill state="connected" /></div>
            <p>Sends shortlisted jobs directly to your personal WhatsApp.</p>
            <div className="button-row">
              <button className="btn btn-secondary" type="button">Reconnect</button>
              <button className="btn btn-quiet" type="button">Disconnect</button>
            </div>
          </div>
        </article>
      </div>
      <div className="helper-note"><PlugZap size={16} /> Connection buttons are UI placeholders until we wire the Hermes API.</div>
    </SectionCard>
  );
}
