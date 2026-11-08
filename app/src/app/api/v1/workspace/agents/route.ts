import { NextResponse } from "next/server";

import {
  getAgentsInstructions,
  updateAgentsInstructions,
} from "@/server/controllers/workspace.controller";

import { handleApiError } from "@/server/errors/error-handler";

/**
 * GET /api/v1/workspace/agents
 *
 * Reads AGENTS.md from the persistent Docker workspace.
 *
 * Returns:
 * {
 *   content: "Job search instructions..."
 * }
 */
export async function GET() {
  try {
    const content = await getAgentsInstructions();

    return NextResponse.json({ content });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/v1/workspace/agents
 *
 * Creates or updates AGENTS.md.
 *
 * Expected body:
 * {
 *   "content": "Updated job search instructions..."
 * }
 *
 * The backend uses a fixed file path.
 * Users cannot specify arbitrary filesystem paths.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Content must be a string.",
          },
        },
        { status: 400 },
      );
    }

    const data = await updateAgentsInstructions(body.content);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
