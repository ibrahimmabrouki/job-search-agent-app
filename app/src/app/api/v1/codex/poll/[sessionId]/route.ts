import { NextResponse } from "next/server";

import { pollCodexLogin } from "@/server/controllers/codex.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    const data = await pollCodexLogin(sessionId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
