"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";

export function ControlsCard() {
  return (
    <SectionCard title="Agent controls" description="Basic runtime controls for the local agent.">
      <div className="control-stack">
        <button className="btn btn-primary wide" type="button"><Play size={16} /> Start agent</button>
        <button className="btn btn-outline wide" type="button"><RotateCcw size={16} /> Restart</button>
        <button className="btn btn-danger wide" type="button"><Square size={14} /> Stop agent</button>
      </div>
    </SectionCard>
  );
}
