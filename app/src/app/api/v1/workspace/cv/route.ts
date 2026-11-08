import { NextResponse } from "next/server";

import { uploadCandidateCv } from "@/server/controllers/workspace.controller";
import { handleApiError } from "@/server/errors/error-handler";

/**
 * POST /api/v1/workspace/cv
 *
 * Uploads or replaces the candidate's CV.pdf.
 *
 * Expected request:
 * Content-Type: multipart/form-data
 *
 * FormData:
 * - file: PDF file selected by the user
 *
 * Flow:
 * Next.js API Route
 * → WorkspaceController
 * → WorkspaceService
 * → HermesClient.uploadCv()
 * → Hermes POST /api/files/upload-stream
 *
 * Important:
 * - The frontend sends an actual PDF, not JSON.
 * - The backend uses a fixed destination path.
 * - The WorkspaceService validates the PDF.
 * - Uploading a new CV replaces the existing CV.pdf.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "A CV PDF file is required.",
          },
        },
        { status: 400 },
      );
    }

    const data = await uploadCandidateCv(file);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
