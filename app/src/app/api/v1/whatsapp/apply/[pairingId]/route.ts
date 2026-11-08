import { NextResponse } from "next/server";

import { applyWhatsAppConnection } from "@/server/controllers/whatsapp.controller";
import { handleApiError } from "@/server/errors/error-handler";

type RouteContext = {
  params: Promise<{
    pairingId: string;
  }>;
};

// route ==> applyWhatsAppConnection(pairingId) ==> WhatsAppService.applyConnection(pairingId) ==> Hermes ==> POST /api/messaging/whatsapp/onboarding/{pairingId}/apply
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { pairingId } = await context.params;

    const data = await applyWhatsAppConnection(pairingId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
