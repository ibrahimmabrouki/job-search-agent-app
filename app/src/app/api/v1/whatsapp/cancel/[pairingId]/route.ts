import { NextResponse } from "next/server";

import { cancelWhatsAppConnection } from "@/server/controllers/whatsapp.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{
    pairingId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { pairingId } = await context.params;

    const data = await cancelWhatsAppConnection(pairingId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
