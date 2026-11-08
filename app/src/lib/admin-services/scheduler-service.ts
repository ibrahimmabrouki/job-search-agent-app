import type { CronJob, JobForm } from "@/types/control-panel/control-panel.types";

export async function getSchedulerJobs(): Promise<CronJob[]> {
  const response = await fetch("/api/v1/scheduler/jobs", { credentials: "same-origin", cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Unable to load scheduled jobs");
  return data as CronJob[];
}

export async function createSchedulerJob(form: JobForm): Promise<void> {
  const response = await fetch("/api/v1/scheduler/jobs", {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
    body: JSON.stringify({ ...form, workdir: "/opt/data/workspace", paused: true }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Unable to create job");
  }
}

export async function updateSchedulerJob(jobId: string, form: JobForm): Promise<void> {
  const response = await fetch(`/api/v1/scheduler/jobs/${encodeURIComponent(jobId)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
    body: JSON.stringify({ updates: form }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Unable to update job");
  }
}

export async function runSchedulerJob(jobId: string, action: "pause" | "resume" | "trigger"): Promise<void> {
  const response = await fetch(`/api/v1/scheduler/jobs/${encodeURIComponent(jobId)}/${action}`, {
    method: "POST", credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || `Unable to ${action} job`);
  }
}