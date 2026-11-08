import type {
  WhatsAppPairing,
  WhatsAppStatus,
} from "@/types/control-panel/control-panel.types";

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await fetch("/api/v1/whatsapp/status", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to load WhatsApp status");
  return data as WhatsAppStatus;
}

export async function startWhatsAppPairing(): Promise<WhatsAppPairing> {
  const response = await fetch("/api/v1/whatsapp/connect", {
    method: "POST",
    credentials: "same-origin",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to start WhatsApp pairing");
  return data as WhatsAppPairing;
}

export async function pollWhatsAppPairing(
  pairingId: string,
): Promise<WhatsAppPairing> {
  const response = await fetch(
    `/api/v1/whatsapp/poll/${encodeURIComponent(pairingId)}`,
    { credentials: "same-origin", cache: "no-store" },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to check WhatsApp pairing");
  return data as WhatsAppPairing;
}

export async function applyWhatsAppPairing(pairingId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/whatsapp/apply/${encodeURIComponent(pairingId)}`,
    { method: "POST", credentials: "same-origin" },
  );
  if (!response.ok) {
    const data = await response.json();
    throw new Error(
      data.error?.message || "Unable to apply WhatsApp connection",
    );
  }
}

export async function cancelWhatsAppPairing(pairingId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/whatsapp/cancel/${encodeURIComponent(pairingId)}`,
    {
      method: "DELETE",
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const data = await response.json();

    throw new Error(data.error?.message || "Unable to cancel WhatsApp pairing");
  }
}
