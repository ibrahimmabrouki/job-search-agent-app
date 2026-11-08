import { createSchedulerService } from "@/server/services/scheduler/scheduler.service";
import type {
  CreateCronJobRequest,
  CronJob,
  CronJobRunsResponse,
  UpdateCronJobRequest,
} from "@/types/scheduler/scheduler.types";

// Retrieves the list of scheduled cron jobs from Hermes.
// Flow: Next.js API Route → Scheduler Controller → SchedulerService.getJobs() → HermesClient → Hermes GET /api/cron/jobs

export const getSchedulerJobs = async (): Promise<CronJob[]> => {
  const schedulerService = createSchedulerService();

  return schedulerService.getJobs();
};

// Creates a new scheduled job through Hermes.
// Flow: Next.js API Route → Scheduler Controller → SchedulerService.createJob() → HermesClient → POST /api/cron/jobs
//
// The controller receives the job configuration and passes it to the service for processing.

export const createSchedulerJob = async (
  data: CreateCronJobRequest,
): Promise<CronJob> => {
  const schedulerService = createSchedulerService();

  return schedulerService.createJob(data);
};

// Pauses an existing Hermes Cron job.
// Flow: Next.js API Route → Scheduler Controller → SchedulerService.pauseJob() → HermesClient → POST /api/cron/jobs/{jobId}/pause
export const pauseSchedulerJob = async (jobId: string): Promise<CronJob> => {
  const schedulerService = createSchedulerService();

  return schedulerService.pauseJob(jobId);
};

// Resumes a previously paused Hermes Cron job.
// Flow: Next.js API Route → Scheduler Controller → SchedulerService.resumeJob() → HermesClient → POST /api/cron/jobs/{jobId}/resume
export const resumeSchedulerJob = async (jobId: string): Promise<CronJob> => {
  const schedulerService = createSchedulerService();

  return schedulerService.resumeJob(jobId);
};

// Manually triggers an existing Hermes Cron job.
// Flow: Next.js API Route → Scheduler Controller  → SchedulerService.triggerJob() → HermesClient → Hermes POST /api/cron/jobs/{jobId}/trigger
// Hermes handles the actual execution and delivery.

export const triggerSchedulerJob = async (jobId: string): Promise<unknown> => {
  const schedulerService = createSchedulerService();

  return schedulerService.triggerJob(jobId);
};

// Retrieves the list of runs for a specific Hermes Cron job.
// Flow: Next.js API Route → Scheduler Controller → SchedulerService.getJobRuns() → HermesClient → Hermes GET /api/cron/jobs/{jobId}/runs
export const getSchedulerJobRuns = async (
  jobId: string,
): Promise<CronJobRunsResponse> => {
  const schedulerService = createSchedulerService();
  return schedulerService.getJobRuns(jobId);
};

// Deletes an existing scheduled job from Hermes.
// Flow: Next.js API → Controller → SchedulerService → HermesClient → Hermes DELETE endpoint
export const deleteSchedulerJob = async (jobId: string): Promise<unknown> => {
  const schedulerService = createSchedulerService();

  return schedulerService.deleteJob(jobId);
};

// Updates selected settings of an existing scheduled job.
// Receives the job ID and the fields the user wants to modify.
// Delegates the update to SchedulerService.
// Only provided fields are updated.
// Hermes returns the updated job configuration.

export const updateSchedulerJob = async (
  jobId: string,
  updates: UpdateCronJobRequest,
): Promise<CronJob> => {
  const schedulerService = createSchedulerService();

  return schedulerService.updateJob(jobId, updates);
};
