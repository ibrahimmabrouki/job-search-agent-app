import { NextResponse } from "next/server";

import {
  getSchedulerJobs,
  createSchedulerJob,
} from "@/server/controllers/scheduler.controller";
import type { CreateCronJobRequest } from "@/types/scheduler/scheduler.types";
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

// Creates a new scheduled job in Hermes.
// Flow: POST /api/v1/scheduler/jobs → Scheduler Controller → SchedulerService.createJob() → HermesClient → Hermes POST /api/cron/jobs
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Validate the required schedule field.
    if (
      typeof body !== "object" ||
      body === null ||
      !("schedule" in body) ||
      typeof body.schedule !== "string" ||
      !body.schedule.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SCHEDULE",
            message: "A valid schedule is required.",
          },
        },
        { status: 400 },
      );
    }

    const data = await createSchedulerJob(body as CreateCronJobRequest);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
