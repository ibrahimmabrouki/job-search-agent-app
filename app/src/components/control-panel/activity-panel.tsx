"use client";

import { Activity, CalendarDays, Clock3, RefreshCw } from "lucide-react";
import type { CronJob } from "@/types/control-panel/control-panel.types";
import { displayDate } from "@/lib/admin-services/format";
import { SectionHeader, StatusDot } from "./primitives";

export function ActivityPanel({ jobs, refreshing, refresh }: {
  jobs: CronJob[];
  refreshing: boolean;
  refresh: () => Promise<void>;
}) {
  const activity = jobs.filter(job => job.last_run_at).slice().sort((a, b) =>
    new Date(b.last_run_at ?? 0).getTime() - new Date(a.last_run_at ?? 0).getTime()).slice(0, 4);
  return <section id="activity" className="neon-panel neon-activity">
    <SectionHeader icon={Activity} title="Recent Activity / Logs" description="Latest verified scheduler activity.">
      <button type="button" className="neon-btn subtle" onClick={() => void refresh()}><RefreshCw size={14} className={refreshing ? "neon-spin" : ""}/> Refresh</button>
    </SectionHeader>
    <div className="neon-activity-list">
      {activity.map(job => <div className="neon-activity-row" key={job.id}>
        <span className="neon-activity-icon"><CalendarDays size={17}/></span>
        <StatusDot active={job.last_status === "ok"} warning={job.last_status !== "ok"}/>
        <div><strong>{job.name}</strong>
          <span>{job.last_status === "ok" ? "Latest run completed" : job.last_error || `Run status: ${job.last_status || "unknown"}`}</span></div>
        <time>{displayDate(job.last_run_at)}</time>
      </div>)}
      {activity.length === 0 && <div className="neon-activity-empty"><Clock3 size={20}/>
        <span>No completed job runs yet. Full runtime logs require a future backend endpoint.</span></div>}
      <p className="neon-activity-disclaimer">Scheduler run summaries only; detailed Hermes logs are not yet exposed by the backend.</p>
    </div>
  </section>;
}