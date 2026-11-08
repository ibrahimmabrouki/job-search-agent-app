import "server-only";

import { createStatusService } from "@/server/services/status/status.service";
import type { HermesStatus } from "@/types/hermes/hermes.types";


// The controller coordinates the API request with the
// application service.
//
// It does NOT:
// - call Hermes directly
// - know about Hermes URLs
// - know about authentication tokens
// - perform fetch()
//
// Those responsibilities belong to lower layers.
//
// Its job is simply:
//
// request
//   ↓
// controller
//   ↓
// StatusService
//   ↓
// return result

export const getStatus = async (): Promise<HermesStatus> => {
  const statusService = createStatusService();

  return statusService.getStatus();
};
