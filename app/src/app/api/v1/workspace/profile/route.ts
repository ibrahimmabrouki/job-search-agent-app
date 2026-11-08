import { NextResponse } from "next/server";

import {
  getCandidateProfile,
  updateCandidateProfile,
} from "@/server/controllers/workspace.controller";

import { handleApiError } from "@/server/errors/error-handler";

/**
 * GET /api/v1/workspace/profile
 *
 * Retrieves the candidate's PROFILE.md content.
 *
 * Returns:
 * {
 *   "content": "Candidate profile..."
 * }
 */
export async function GET() {
  try {
    const content = await getCandidateProfile();

    return NextResponse.json({ content });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/v1/workspace/profile
 *
 * Creates or replaces PROFILE.md using text content.
 *
 * Expected request body:
 * {
 *   "content": "Candidate's updated profile..."
 * }
 *
 * The file path is fixed by the backend.
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

    const data = await updateCandidateProfile(body.content);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
