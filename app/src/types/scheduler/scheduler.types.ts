// Defines the information sent to Hermes when creating a cron job.
// Matches the relevant fields of Hermes' CronJobCreate schema.

export type CreateCronJobRequest = {
  schedule: string; // Required: e.g. "every 8h"
  name?: string; // Job name
  prompt?: string; // Instructions for the agent
  deliver?: string; // e.g. "whatsapp"
  workdir?: string; // Workspace directory inside Docker
  paused?: boolean; // Whether the job starts paused
  model?: string; // Optional model override
  provider?: string; // Optional provider override
  no_agent?: boolean;
  script?: string;
};

export type CronJobSchedule = {
  kind: string;
  minutes?: number;
  display: string;
};

export type CronJob = {
  id: string;
  name: string;
  prompt: string;
  schedule: CronJobSchedule;
  schedule_display: string;

  enabled: boolean;
  state: string;

  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_delivery_error: string | null;

  deliver: string;
  workdir: string | null;

  created_at: string;
  paused_at: string | null;
  paused_reason: string | null;

  failure_streak: number;
  scheduler_heartbeat_age_s: number | null;
};

export type CronJobRunsResponse = {
  runs: CronJobRun[];
  limit: number;
};

export type CronJobRun = {
  id: string;
  started_at: number;
  ended_at: number | null;
  is_active: boolean;
  archived: boolean;
};

export type UpdateCronJobRequest = {
  name?: string;
  schedule?: string;
  prompt?: string;
  deliver?: string;
  workdir?: string | null;
  model?: string | null;
  provider?: string | null;
  base_url?: string | null;
  skills?: string[];
  script?: string | null;
  no_agent?: boolean;
  context_from?: string[];
  enabled_toolsets?: string[];
};

// Hermes expects updates inside an updates object, not directly in the request body.
// For example, to change a job's name and schedule:
// {
//   "updates": {
//     "name": "Daily AI Job Search",
//     "schedule": "every 24h"
//   }
// }
export type HermesCronJobUpdateBody = {
  updates: UpdateCronJobRequest;
};
