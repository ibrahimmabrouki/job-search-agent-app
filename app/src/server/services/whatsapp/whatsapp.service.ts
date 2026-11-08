import "server-only";

// These are the imports that are needed when we want to communicate with Hermes server
import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";

// These are the imports that are needed when we want to communicate with Manager server
// The service will be connect -reconnect-, poll, and apply
import { createManagerClient } from "@/server/clients/manager/manager.client";
import { MANAGER_ENDPOINTS } from "@/server/constants/manager.constants";

import type { HermesStatus } from "@/types/hermes/hermes.types";
import type {
  WhatsAppStatus,
  WhatsAppConnectResponse,
  WhatsAppApplyResponse,
  WhatsAppPollResponse,
  WhatsAppCancelResponse,
} from "@/types/whatsapp/whatsapp.types";

export class WhatsAppService {
  public async getStatus(): Promise<WhatsAppStatus> {
    const hermesClient = createHermesClient();

    // This service is responsible for the application-level
    // "WhatsApp status" feature.
    // We already know where Hermes exposes the raw data: GET /api/status → gateway_platforms.whatsapp
    // Our service will read that raw Hermes structure and convert it into the cleaner response our frontend wants.
    // Hermes /api/status ==> get whole Hermes status ==> take gateway_platforms.whatsapp ==> convert raw Hermes field names ==> return clean WhatsAppStatus

    const status = await hermesClient.get<HermesStatus>(
      HERMES_ENDPOINTS.STATUS,
    );

    // WhatsApp may be absent when it is not configured or disconnected.
    // WhatsApp may be absent when it is not configured or disconnected.
    const whatsapp = status.gateway_platforms?.whatsapp;

    return {
      connected: whatsapp?.state === "connected",
      state: whatsapp?.state ?? "disconnected",
      needsAttention: whatsapp?.needs_attention ?? true,
      errorCode: whatsapp?.error_code ?? null,
      errorMessage: whatsapp?.error_message ?? null,
      updatedAt: whatsapp?.updated_at ?? null,
    };
    // For example, Hermes gives:
    // {
    //   "state": "disconnected",
    //   "needs_attention": true,
    //   "error_code": null
    // }

    // Our app converts that to:
    // {
    //   "connected": false,
    //   "state": "disconnected",
    //   "needsAttention": true,
    //   "errorCode": null
    // }
  }

  //   WhatsAppService → ManagerClient → Manager :9200 → Hermes
  public async startConnection(): Promise<WhatsAppConnectResponse> {
    const managerClient = createManagerClient();

    return managerClient.post<WhatsAppConnectResponse>(
      MANAGER_ENDPOINTS.WHATSAPP.CONNECT,
    );
  }

  // Important distinction between Connect, Apply, and Status:
  //
  // 1. Connect:
  //    WhatsAppService.startConnection() calls our FastAPI Manager.
  //    Manager starts a new pairing session or safely reconnects
  //    an existing WhatsApp account.
  //
  //    Connect returns a pairingId that identifies the pairing attempt.
  //    The frontend then polls until the pairing status is "connected".
  //
  // 2. Apply:
  //    A pairing status of "connected" means WhatsApp pairing
  //    succeeded, but it does not necessarily mean the Hermes
  //    Gateway is already using WhatsApp.
  //
  //    After successful pairing, applyConnection(pairingId) tells
  //    Manager to activate the WhatsApp connection.
  //
  //    Manager is responsible for:
  //    - Applying the pairing through Hermes.
  //    - Ensuring the Hermes Gateway is running.
  //    - Verifying WhatsApp is connected to the Gateway.
  //    - Configuring the self-chat home channel automatically.
  //
  // 3. Status:
  //    getStatus() reads Hermes runtime status to determine
  //    whether WhatsApp is currently connected and operational.
  //
  // Example:
  //    Poll returns status = "connected"
  //    but getStatus() may still return connected = false.
  //
  //    This means pairing succeeded, but the Gateway is not
  //    yet using the WhatsApp connection.
  //
  // Complete flow:
  // Connect → Poll → QR Scan → Pairing Connected
  // → Apply → Gateway Ready → WhatsApp Connected
  //
  // Communication:
  // Next.js API Route
  // → WhatsApp Controller
  // → WhatsAppService.applyConnection()
  // → ManagerClient
  // → Manager POST /whatsapp/apply/{pairingId}
  // → Hermes internally

  public async applyConnection(
    pairingId: string,
  ): Promise<WhatsAppApplyResponse> {
    const managerClient = createManagerClient();

    return managerClient.post<WhatsAppApplyResponse>(
      MANAGER_ENDPOINTS.WHATSAPP.APPLY(pairingId),
    );
  }

  // Polls an existing WhatsApp pairing session through our FastAPI Manager.
  //
  // Flow:
  // Next.js API route
  // → WhatsApp Controller
  // → WhatsAppService.pollConnection()
  // → ManagerClient
  // → Manager GET /whatsapp/poll/{pairingId}
  // → Hermes internally
  //
  // The pairingId identifies the specific connection attempt.
  //
  // Possible statuses:
  // - installing/starting: WhatsApp pairing is being prepared.
  // - waiting: QR code is available for scanning.
  // - connected: QR was successfully scanned.
  // - expired/error: Pairing failed or expired.
  //
  // Important:
  // QR codes may change between polling requests.
  // The frontend must update the displayed QR when qr_payload changes.

  public async pollConnection(
    pairingId: string,
  ): Promise<WhatsAppPollResponse> {
    const managerClient = createManagerClient();

    return managerClient.get<WhatsAppPollResponse>(
      MANAGER_ENDPOINTS.WHATSAPP.POLL(pairingId),
    );
  }

  // This service will be used if the user wants to cancel a temporary WhatsApp pairing session. This is the case if the user started a pairing session but then changed their mind and wants to cancel it. The pairingId identifies the exact temporary WhatsApp pairing session we want to cancel.
  public async cancelConnection(
    pairingId: string,
  ): Promise<WhatsAppCancelResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.delete<WhatsAppCancelResponse>(
      HERMES_ENDPOINTS.WHATSAPP.CANCEL_ONBOARDING(pairingId),
    );
  }
}

export const createWhatsAppService = (): WhatsAppService => {
  return new WhatsAppService();
};
