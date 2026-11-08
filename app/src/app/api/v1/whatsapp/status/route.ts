import { NextResponse } from "next/server";

import { getWhatsAppStatus } from "@/server/controllers/whatsapp.controller";
import { handleApiError } from "@/server/errors/error-handler";

// GET /api/v1/whatsapp/status ==> getWhatsAppStatus() ==> WhatsAppService.getStatus() ==> Hermes /api/status ==> gateway_platforms.whatsapp ==> clean response for our UI
export async function GET() {
  try {
    const data = await getWhatsAppStatus();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
