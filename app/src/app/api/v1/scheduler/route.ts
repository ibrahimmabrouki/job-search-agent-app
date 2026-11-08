import { NextResponse } from "next/server";

import { getSchedulerJobs } from "@/server/controllers/scheduler.controller";
import { handleApiError } from "@/server/errors/error-handler";

// Retrieves all scheduled cron jobs from Hermes.
// Flow: GET /api/v1/scheduler/jobs → Scheduler Controller → SchedulerService.getJobs() → HermesClient → Hermes GET /api/cron/jobs

export async function GET() {
  try {
    const data = await getSchedulerJobs();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
