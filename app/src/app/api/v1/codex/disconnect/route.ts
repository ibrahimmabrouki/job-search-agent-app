import { NextResponse } from "next/server";

import { disconnectCodex } from "@/server/controllers/codex.controller";
import { handleApiError } from "@/server/errors/error-handler";

export async function DELETE() {
  try {
    const data = await disconnectCodex();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
