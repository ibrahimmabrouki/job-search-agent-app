import { NextResponse } from "next/server";

import { cancelCodexLogin } from "@/server/controllers/codex.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    const data = await cancelCodexLogin(sessionId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
