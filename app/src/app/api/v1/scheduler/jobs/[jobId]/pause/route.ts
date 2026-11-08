import { NextResponse } from "next/server";

import { pauseSchedulerJob } from "@/server/controllers/scheduler.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

// Pauses an existing Hermes Cron job.
// Flow: Next.js POST /api/v1/scheduler/jobs/{jobId}/pause → Scheduler Controller → Scheduler Service → HermesClient → Hermes POST /api/cron/jobs/{jobId}/pause
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;

    const data = await pauseSchedulerJob(jobId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
