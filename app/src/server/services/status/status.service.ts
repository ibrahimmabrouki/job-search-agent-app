// This service belongs only on the backend.
import "server-only";

// gives the service access to our shared Hermes communication layer.
import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";
import type { HermesStatus } from "@/types/hermes/hermes.types";

// This service is responsible for the application-level
// "status" feature.
//
// Its job is NOT to perform low-level HTTP configuration.
// HermesClient already handles:
// - base URL
// - authentication header
// - fetch()
// - timeouts
// - Hermes request errors
//
// This service only expresses the business operation:
//
// "Get the current Hermes system status."

export class StatusService {
  // For now we use: unknown because we have not yet defined the exact Hermes status response type in:
  // That is intentional. We should not invent a type until we model the real response we already observed.
  public async getStatus(): Promise<HermesStatus> {
    const hermesClient = createHermesClient();

    return hermesClient.get<HermesStatus>(HERMES_ENDPOINTS.STATUS);
  }
}

// Factory function used by controllers.
//
// Keeping creation behind a factory makes it easier to
// change dependency construction later without changing
// every controller that uses StatusService.
export const createStatusService = (): StatusService => {
  return new StatusService();
};

// Note: we are passing HermesStatus as the generic type to hermesClient.get()
// Suppose that Hermes returns this: 
// const response = {
//   status: "ok",
//   recent_unhandled_errors: 0,
//   last_error_at: null,
//   selftest: "ok",
// };

// And suppose that the defined type says: 
// type HermesComponentStatus = {
//   status: string;
//   state?: string;
// };

// In this case: TypeScript is basically asking: “Does this object have at least the properties required by HermesComponentStatus?”
// status → yes 
// state → optional, so okay if missing 

// The extra fields: recent_unhandled_errors, last_error_at, selftest
// So this is allowed: const x: HermesComponentStatus = response;

// because response has everything HermesComponentStatus requires, plus extra information.
// Think of the type as a minimum contract

// What would fail is the opposite: if the type required a field that is missing from the response.
// For, example: { recent_unhandled_errors: 0 } then it is missing: status
// And that would not satisfy the type: HermesComponentStatus = { status: string; }; 

// More fields than the type → okay
// Missing required fields → not okay
// Wrong type for required fields → not okay