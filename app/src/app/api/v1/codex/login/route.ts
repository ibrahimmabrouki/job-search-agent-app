import { NextResponse } from "next/server";

import { startCodexLogin } from "@/server/controllers/codex.controller";
import { handleApiError } from "@/server/errors/error-handler";

export async function POST() {
  try {
    const data = await startCodexLogin();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
