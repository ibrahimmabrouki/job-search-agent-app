"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  LoaderCircle,
  MessageCircle,
  Pause,
  Pencil,
  Play,
  Plus,
} from "lucide-react";
import type { CronJob } from "@/types/control-panel/control-panel.types";
import { displayDate } from "@/lib/admin-services/format";
import { SectionHeader, StatusPill } from "../primitives";

// Defines the props received from SchedulerManager.
type SchedulerPanelProps = {
  jobs: CronJob[];
  busy: boolean;
  runningJobId: string | null;
  loading: boolean;
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  runJobOperation: (
    id: string,
    action: "pause" | "resume" | "trigger",
  ) => Promise<void>;
  openExistingJob: (job: CronJob) => void;
  openNewJob: () => void;
};

export function SchedulerPanel({
  jobs,
  busy,
  runningJobId,
  loading,
  selectedJobId,
  setSelectedJobId,
  runJobOperation,
  openExistingJob,
  openNewJob,
}: SchedulerPanelProps) {
  return (
    <section id="scheduler" className="neon-panel neon-scheduler">
      <SectionHeader
        icon={CalendarDays}
        title="Scheduler / Jobs"
        description="Scheduled jobs, automations, and recurring tasks."
      >
        <span className="neon-count">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
        <button type="button" className="neon-btn vivid" onClick={openNewJob}>
          <Plus size={17} /> Create Job
        </button>
      </SectionHeader>
      <div className="neon-table-scroll">
        <table className="neon-jobs-table">
          <thead>
            <tr>
              <th>Job Name</th>
              <th>Status</th>
              <th>Delivery</th>
              <th>Last Run</th>
              <th>Next Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td className="neon-empty" colSpan={6}>
                  {loading
                    ? "Loading scheduled jobs…"
                    : "No jobs found. Create a schedule to begin."}
                </td>
              </tr>
            ) : null}
            {jobs.map((job) => (
              <tr
                key={job.id}
                className={selectedJobId === job.id ? "selected" : ""}
              >
                <td>
                  <button
                    type="button"
                    className="neon-job-selector"
                    onClick={() => setSelectedJobId(job.id)}
                    title="Select job"
                  >
                    <BriefcaseBusiness size={19} />
                    <span>
                      <strong>{job.name}</strong>
                      <small>
                        {job.schedule_display || "Schedule unavailable"}
                      </small>
                    </span>
                  </button>
                </td>
                <td>
                  <StatusPill active={job.enabled} warning={!job.enabled}>
                    {job.enabled ? "Active" : "Paused"}
                  </StatusPill>
                </td>
                <td>
                  <span className="neon-delivery">
                    <MessageCircle size={16} />
                    {job.deliver || "local"}
                  </span>
                </td>
                <td className="neon-datetime">
                  {displayDate(job.last_run_at)}
                </td>
                <td className="neon-datetime">
                  {job.enabled ? displayDate(job.next_run_at) : "—"}
                </td>
                <td>
                  <div className="neon-job-actions">
                    <button
                      type="button"
                      className="neon-run-btn"
                      title="Run job now"
                      disabled={busy || runningJobId !== null}
                      onClick={() => void runJobOperation(job.id, "trigger")}
                    >
                      {runningJobId === job.id ? (
                        <LoaderCircle size={13} className="neon-spin" />
                      ) : (
                        <Play size={12} fill="currentColor" />
                      )}
                      <span>Run Now</span>
                    </button>
                    <button
                      type="button"
                      className="neon-square-btn"
                      disabled={
                        busy ||
                        runningJobId === job.id ||
                        (runningJobId !== null && !job.enabled)
                      }
                      title={job.enabled ? "Pause job" : "Resume job"}
                      aria-label={
                        job.enabled ? `Pause ${job.name}` : `Resume ${job.name}`
                      }
                      onClick={() =>
                        void runJobOperation(
                          job.id,
                          job.enabled ? "pause" : "resume",
                        )
                      }
                    >
                      {job.enabled ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      type="button"
                      className="neon-square-btn"
                      disabled={runningJobId === job.id}
                      title="Edit job"
                      aria-label={`Edit ${job.name}`}
                      onClick={() => openExistingJob(job)}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
