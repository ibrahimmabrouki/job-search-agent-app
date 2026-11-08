import { NextResponse } from "next/server";

import {
  deleteSchedulerJob,
  updateSchedulerJob,
} from "@/server/controllers/scheduler.controller";
import { handleApiError } from "@/server/errors/error-handler";
import type { UpdateCronJobRequest } from "@/types/scheduler/scheduler.types";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

// /DELETE /api/v1/scheduler/jobs/{jobId}
// Permanently deletes a scheduled job from Hermes.
// Flow: Next.js → Controller → Service → HermesClient → Hermes
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;

    const data = await deleteSchedulerJob(jobId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/v1/scheduler/jobs/{jobId}
//  Updates selected settings of an existing scheduled job.
//  Expected request body:
//   {
//     "updates": {
//       "name": "Daily AI Job Search",
//       "schedule": "every 24h",
//       "deliver": "whatsapp"
//     }
//   }
// Flow: Next.js → Controller → Service → HermesClient → Hermes

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !body.updates ||
      typeof body.updates !== "object" ||
      Array.isArray(body.updates)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "An updates object is required.",
          },
        },
        { status: 400 },
      );
    }

    const data = await updateSchedulerJob(
      jobId,
      body.updates as UpdateCronJobRequest,
    );

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
