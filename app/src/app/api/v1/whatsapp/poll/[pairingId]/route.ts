import { NextResponse } from "next/server";

import { pollWhatsAppConnection } from "@/server/controllers/whatsapp.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{
    pairingId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { pairingId } = await context.params;

    const data = await pollWhatsAppConnection(pairingId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
