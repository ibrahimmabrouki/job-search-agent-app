import { NextResponse } from "next/server";

import { startWhatsAppConnection } from "@/server/controllers/whatsapp.controller";
import { handleApiError } from "@/server/errors/error-handler";

// Why no body? Because our backend is already hardcoding the Hermes-specific pairing mode:
// {
//   "mode": "self-chat",
//   "allowed_users": ""
// }

// POST /api/v1/whatsapp/connect ==> startWhatsAppConnection() ==> WhatsAppService.startConnection() ==> HermesClient.post(...) ==> POST /api/messaging/whatsapp/onboarding/start ==> Hermes creates a temporary pairing session
export async function POST() {
  try {
    const data = await startWhatsAppConnection();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
