/*
 * HERMES FRONTEND SERVICE
 *
 * This service is responsible for requesting Hermes status from our Next.js backend.
 *
 * Request flow: DashboardManager
 *    → getHermesStatus()
 *    → GET /api/v1/status (Next.js backend)
 *    → Next.js communicates with Hermes
 *    → Next.js returns JSON
 *    → This service returns the data to DashboardManager
 *
 * The frontend never communicates directly with Hermes.
 */

import type { HermesStatus } from "@/types/control-panel/control-panel.types";

/*
 * Fetches the current Hermes status.
 *
 * Promise<HermesStatus> means: This is an asynchronous function and when successful, it resolves to a HermesStatus object.
 *
 * Example usage in DashboardManager:
 * const status = await getHermesStatus();
 * setHermes(status);
 */
export async function getHermesStatus(): Promise<HermesStatus> {
  // Send a GET request to our Next.js backend.
  // credentials: "same-origin" includes applicable same-origin cookies.
  // cache: "no-store" prevents using a cached response.
  const response = await fetch("/api/v1/status", {
    credentials: "same-origin",
    cache: "no-store",
  });

  // Convert the JSON response body into a JavaScript value.
  const data = await response.json();

  /*
   * SUCCESS RESPONSE (HTTP 200)
   *
   * Our Next.js backend returns the Hermes status object.
   *
   * Example of some fields in the response:
   *
   * {
   *   "version": "0.21.4",
   *   "gateway_running": true,
   *   "gateway_state": "running",
   *   "overall": "ok",
   *   "active_sessions": 0
   * }
   *
   * Note: Hermes may return additional fields.
   * Our frontend HermesStatus type currently describes
   * only the properties needed by the dashboard.
   */

  /*
   * ERROR RESPONSE
   *
   * If the request fails, our Next.js backend uses
   * handleApiError() to return a structured error.
   *
   * Example 1: Hermes is unreachable (HTTP 502)
   *
   * {
   *   "success": false,
   *   "error": {
   *     "code": "HERMES_UNAVAILABLE",
   *     "message": "Unable to communicate with Hermes"
   *   }
   * }
   *
   * Example 2: Hermes request times out (HTTP 504)
   *
   * {
   *   "success": false,
   *   "error": {
   *     "code": "HERMES_TIMEOUT",
   *     "message": "Hermes request timed out after 10000ms"
   *   }
   * }
   *
   * Example 3: Unexpected backend error (HTTP 500)
   *
   * {
   *   "success": false,
   *   "error": {
   *     "code": "INTERNAL_SERVER_ERROR",
   *     "message": "An unexpected error occurred"
   *   }
   * }
   *
   * response.ok is true for HTTP status codes 200–299.
   *
   * If false, we throw an Error containing the backend's
   * error message, or a fallback message if unavailable.
   *
   * The caller can then handle this rejected request.
   */
  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to load Hermes status");
  }

  /*
   * Return the successful response.
   *
   * "as HermesStatus" tells TypeScript to treat data
   * as a HermesStatus object.
   *
   * It does not modify or validate the actual data.
   */
  return data as HermesStatus;
}
