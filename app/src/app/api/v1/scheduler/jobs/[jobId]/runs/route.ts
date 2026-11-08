import { NextResponse } from "next/server";

import { getSchedulerJobRuns } from "@/server/controllers/scheduler.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

// GET /api/v1/scheduler/jobs/{jobId}/runs
// Retrieves execution history without running the job.

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;

    const data = await getSchedulerJobRuns(jobId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
