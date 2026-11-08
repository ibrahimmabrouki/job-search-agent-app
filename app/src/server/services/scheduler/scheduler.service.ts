import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";

import type {
  CreateCronJobRequest,
  CronJob,
  CronJobRunsResponse,
  UpdateCronJobRequest,
} from "@/types/scheduler/scheduler.types";

export class SchedulerService {
  // Retrieves scheduled cron jobs from Hermes.
  // Flow: SchedulerService → HermesClient → GET /api/cron/jobs → Hermes API :9119
  public async getJobs(): Promise<CronJob[]> {
    const hermesClient = createHermesClient();

    return hermesClient.get<CronJob[]>(HERMES_ENDPOINTS.CRON.JOBS);
  }

  // Creates a new scheduled cron job in Hermes.
  // Flow: SchedulerService.createJob() → HermesClient → POST /api/cron/jobs → Hermes stores the job in its persistent cron storage.
  // The request contains the schedule, prompt, delivery target, and other optional job configuration.
  // Hermes is responsible for validating and scheduling the job.
  public async createJob(data: CreateCronJobRequest): Promise<CronJob> {
    const hermesClient = createHermesClient();

    return hermesClient.post<CronJob>(HERMES_ENDPOINTS.CRON.JOBS, data);
  }

  // Pauses an existing Hermes Cron job.
  // Flow: SchedulerService → HermesClient → POST /api/cron/jobs/{jobId}/pause
  // The job remains saved but will not execute automatically while paused.
  public async pauseJob(jobId: string): Promise<CronJob> {
    const hermesClient = createHermesClient();

    return hermesClient.post<CronJob>(HERMES_ENDPOINTS.CRON.PAUSE(jobId));
  }

  // Resumes a previously paused Hermes Cron job.
  // Flow: SchedulerService → HermesClient → POST /api/cron/jobs/{jobId}/resume
  // Hermes enables the job and manages its next scheduled execution.
  public async resumeJob(jobId: string): Promise<CronJob> {
    const hermesClient = createHermesClient();

    return hermesClient.post<CronJob>(HERMES_ENDPOINTS.CRON.RESUME(jobId));
  }

  // Manually triggers an existing Hermes Cron job.
  // Flow: SchedulerService → HermesClient → POST /api/cron/jobs/{jobId}/trigger

  // Hermes handles the execution of the scheduled job.
  // The job's configured prompt, model, workspace, and delivery settings are reused.
  // Unlike Resume, Run Now requests an immediate execution rather than waiting for the next scheduled time.

  public async triggerJob(jobId: string): Promise<unknown> {
    const hermesClient = createHermesClient();

    return hermesClient.post<unknown>(
      HERMES_ENDPOINTS.CRON.TRIGGER(jobId),
      undefined,
      { timeoutMs: 180_000 },
    );
  }

  // Retrieves AI agent sessions created by a scheduled Cron job.
  // Flow: SchedulerService → HermesClient → GET /api/cron/jobs/{jobId}/runs

  // Hermes returns:
  // {
  //   runs: [...], // AI agent sessions associated with this job
  //   limit: 20     // Maximum number of sessions requested
  // }

  // IMPORTANT: The /runs endpoint reads from Hermes' SessionDB, NOT executions.db.

  // Our investigation confirmed:
  // - Jobs with no_agent=true can execute successfully ==> Their execution status is recorded in executions.db.
  // - Their output is saved under /opt/data/cron/output/.
  // - They may return runs: [] because no AI agent session was created.

  // Conclusion:
  // An empty runs array does NOT mean the job failed.
  // Use the job's last_status/last_error to check execution results.
  // Use this endpoint to retrieve AI agent session history.
  // The exact session response fields still need verification.
  public async getJobRuns(jobId: string): Promise<CronJobRunsResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.get<CronJobRunsResponse>(
      HERMES_ENDPOINTS.CRON.RUNS(jobId),
    );
  }

  // Permanently deletes a scheduled Cron job from Hermes.
  // Flow: SchedulerService → HermesClient → DELETE /api/cron/jobs/{jobId}
  // This removes the job from the scheduler so it will no longer execute automatically.
  public async deleteJob(jobId: string): Promise<unknown> {
    const hermesClient = createHermesClient();

    return hermesClient.delete<unknown>(HERMES_ENDPOINTS.CRON.DELETE(jobId));
  }

  // Hermes expects updates inside an updates object, not directly in the request body.
  // For example, to change a job's name and schedule:
  // {
  //   "updates": {
  //     "name": "Daily AI Job Search",
  //     "schedule": "every 24h"
  //   }
  // }

  /**
   * Updates an existing scheduled job in Hermes.
   *
   * The user can modify the following settings:
   *
   * 1. name:
   *    Change the job's display name.
   *    Example: "Weekly Job Search" → "Daily Job Search"
   *
   * 2. schedule:
   *    Change when or how frequently the job executes.
   *    Example: "every 8h" → "every 24h"
   *
   * 3. prompt:
   *    Change the instructions executed by the AI agent.
   *    Example: Search for AI Engineer roles instead of Backend roles.
   *
   * 4. deliver:
   *    Change where the execution results are delivered.
   *    Example: "local" → "whatsapp"
   *
   * 5. workdir:
   *    Change the job's working directory.
   *    This determines which workspace files the agent can access,
   *    such as AGENTS.md, PROFILE.md, and the user's CV.
   *
   * 6. model:
   *    Change the AI model used to execute the job.
   *
   * 7. provider:
   *    Change the configured AI provider used by the job.
   *
   * 8. base_url:
   *    Change the custom API endpoint for the model provider.
   *
   * 9. skills:
   *    Change which installed Hermes skills the job uses.
   *
   * 10. script:
   *     Change the script file executed by the job.
   *     The value must reference an existing script file,
   *     not an inline shell command.
   *
   * 11. no_agent:
   *     Change the execution mode.
   *     - false: Run using the AI agent.
   *     - true: Run a script without launching an AI agent.
   *     IMPORTANT: no_agent=true requires a valid script.
   *
   * 12. context_from:
   *     Change which existing session contexts are made
   *     available to the job.
   *
   * 13. enabled_toolsets:
   *     Change which configured toolsets are available
   *     during job execution.
   *
   * IMPORTANT BEHAVIOR:
   *
   * - Only fields included in the updates object are modified.
   * - Fields not provided retain their existing values.
   * - The job ID cannot be changed.
   * - Updating a schedule recalculates its scheduling information.
   * - Updating a paused job does not automatically resume it.
   * - Changes affect future executions, not previous results.
   *
   * REQUEST FORMAT:
   * {
   *   updates: {
   *     name: "Daily AI Job Search",
   *     schedule: "every 24h",
   *     deliver: "whatsapp"
   *   }
   * }
   *
   * Returns the updated CronJob object from Hermes.
   */

  public async updateJob(
    jobId: string,
    updates: UpdateCronJobRequest,
  ): Promise<CronJob> {
    const hermesClient = createHermesClient();

    return hermesClient.put<CronJob>(HERMES_ENDPOINTS.CRON.UPDATE(jobId), {
      updates,
    });
  }
}

export const createSchedulerService = (): SchedulerService => {
  return new SchedulerService();
};
