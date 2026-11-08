import type {
  WhatsAppStatus,
  WhatsAppApplyResponse,
  WhatsAppConnectResponse,
  WhatsAppPollResponse,
  WhatsAppCancelResponse,
} from "@/types/whatsapp/whatsapp.types";
import { createWhatsAppService } from "@/server/services/whatsapp/whatsapp.service";

// route ==> getWhatsAppStatus() ==> WhatsAppService.getStatus() ==> Hermes /api/status ==> gateway_platforms.whatsapp
export const getWhatsAppStatus = async (): Promise<WhatsAppStatus> => {
  const whatsappService = createWhatsAppService();

  return whatsappService.getStatus();
};

// route ==> startConnection() ==> WhatsAppService.startConnection() ==> Hermes /api/onboarding/whatsapp
// startConnection() ==> create HermesClient ==> POST onboarding request ==> Hermes creates a temporary WhatsApp pairing session ==> return Hermes' raw response
export const startWhatsAppConnection =
  async (): Promise<WhatsAppConnectResponse> => {
    const whatsappService = createWhatsAppService();

    return whatsappService.startConnection();
  };

// route ==> applyConnection(pairingId) ==> WhatsAppService.applyConnection(pairingId) ==> Hermes /api/onboarding/whatsapp/apply
// route ==> applyWhatsAppConnection(pairingId) ==> WhatsAppService.applyConnection(pairingId) ==> Hermes ==>POST /api/messaging/whatsapp/onboarding/{pairingId}/apply
export const applyWhatsAppConnection = async (
  pairingId: string,
): Promise<WhatsAppApplyResponse> => {
  const whatsappService = createWhatsAppService();

  return whatsappService.applyConnection(pairingId);
};

// route ==> pollWhatsAppConnection(pairingId) ==> WhatsAppService.pollConnection(pairingId) ==> Hermes ==> GET /api/messaging/whatsapp/onboarding/{pairingId}
export const pollWhatsAppConnection = async (
  pairingId: string,
): Promise<WhatsAppPollResponse> => {
  const whatsappService = createWhatsAppService();

  return whatsappService.pollConnection(pairingId);
};

// route ==> cancelWhatsAppConnection(pairingId) ==> WhatsAppService.cancelConnection(pairingId) ==> Hermes ==> DELETE /api/messaging/whatsapp/onboarding/{pairingId}
export const cancelWhatsAppConnection = async (
  pairingId: string,
): Promise<WhatsAppCancelResponse> => {
  const whatsappService = createWhatsAppService();

  return whatsappService.cancelConnection(pairingId);
};
