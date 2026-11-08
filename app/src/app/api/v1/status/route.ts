import { NextResponse } from "next/server";

import { getStatus } from "@/server/controllers/status.controller";
import { handleApiError } from "@/server/errors/error-handler";

export async function GET() {
  try {
    const data = await getStatus();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
