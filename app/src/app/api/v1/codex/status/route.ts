export {};
import { NextResponse } from "next/server";

import { getCodexStatus } from "@/server/controllers/codex.controller";
import { handleApiError } from "@/server/errors/error-handler";

export async function GET() {
  try {
    const data = await getCodexStatus();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
