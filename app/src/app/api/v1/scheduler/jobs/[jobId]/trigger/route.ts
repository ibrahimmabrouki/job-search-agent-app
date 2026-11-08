import { NextResponse } from "next/server";

import { triggerSchedulerJob } from "@/server/controllers/scheduler.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

// Manually triggers an existing Hermes Cron job.
// Flow: Next.js POST /api/v1/scheduler/jobs/{jobId}/trigger → Scheduler Controller → SchedulerService.triggerJob() → HermesClient → Hermes POST /api/cron/jobs/{jobId}/trigger

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;

    const data = await triggerSchedulerJob(jobId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
