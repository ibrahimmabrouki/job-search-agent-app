"use client";

import { CalendarClock, Play } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatusPill } from "@/components/ui/status-pill";

export function SchedulerCard() {
  return (
    <SectionCard title="Scheduler" description="Control when the automated job search runs.">
      <div className="schedule-highlight">
        <div className="schedule-icon"><CalendarClock size={22} /></div>
        <div className="schedule-copy"><span>Current schedule</span><strong>Every 8 hours</strong><small>Next run will be calculated by Hermes.</small></div>
        <StatusPill state="active" />
      </div>
      <div className="button-row schedule-actions">
        <button className="btn btn-primary" type="button"><Play size={15} /> Run now</button>
        <button className="btn btn-outline" type="button">Edit schedule</button>
        <button className="btn btn-quiet" type="button">Pause</button>
      </div>
    </SectionCard>
  );
}
