// This file is responsible for holding Hermes-specific constant values that should not be repeated across the codebase.
// For example it will hold the URLs
// ==> fewer typos
// ==> easier maintenance if Hermes changes an endpoint later

export const MANAGER_ENDPOINTS = {
  WHATSAPP: {
    CONNECT: "/whatsapp/connect",

    POLL: (pairingId: string) =>
      `/whatsapp/poll/${encodeURIComponent(pairingId)}`,

    APPLY: (pairingId: string) =>
      `/whatsapp/apply/${encodeURIComponent(pairingId)}`,
  },
} as const;

// CONNECT identifies the Manager endpoint that starts a connection or reconnection.

// POLL checks the pairing progress.

// APPLY activates the WhatsApp connection.

// encodeURIComponent() safely includes the pairing ID in the URL.
