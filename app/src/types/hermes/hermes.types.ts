// This creates a custom type called: HermesGatewayState
// and says the value is only allowed to be one of these exact strings.

// const state: HermesGatewayState = "running"; is valid
// but
// const state: HermesGatewayState = "hello"; is invalid and will throw a TypeScript error.

export type HermesGatewayState =
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "unknown";

// This creates a custom type called: HermesOverallStatus
// and says the value is only allowed to be one of these exact strings.

// ok ==> everything healthy
// degraded ==> Hermes works, but something has a problem
// For example: because WhatsApp was disconnected even though the Gateway itself was working.

// error ==> serious problem
// unknown ==> state cannot be determined
export type HermesOverallStatus = "ok" | "degraded" | "error" | "unknown";

// This defines a reusable shape for individual Hermes components.
// These components are: gateway, dashboard, storage, and platforms.

// From the real response we saw things like:
// "gateway": { "status": "ok", "state": "running" }
// "dashboard": { "status": "ok", "recent_unhandled_errors": 0, "last_error_at": null, "selftest": "ok" }

// The common field that we care about is: status: string;
// The optional field is state?: string; because not all components have a state field in the response.
// So, { status: "ok" } and { status: "ok", state: "running" } are both valid shapes for this type.
export type HermesComponentStatus = {
  status: string;
  state?: string;
};
// Since we are using HermesStatus as the main structured response type for the Hermes status API
// And Hermes itself returns a nested struture with components and platforms
// Inside the response we have Hermes gate_wayplatforms which ara included in the response
// "gateway_platforms": {
//   "api_server": { ... },
//   "whatsapp": { ... }
// }
//  to provide information about the status of the platforms that are connected to Hermes
// Note: Hermes calls them platforms because the Gatewat can communicate through different external channels/platforms 
// for example: WhatsApp, Telegram, etc. and each platform has its own status information
// Hermes Gateway
// ├── API Server
// └── WhatsApp
// So HermesPlatformStatus is just our TypeScript name for the common structure Hermes uses for one of those platforms: It does not mean our frontend will use /api/status directly.
export type HermesPlatformStatus = {
  state: string;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
  needs_attention: boolean;
  retrying_since: string | null;
};

// This is the main response type for the Hermes status API
// This represents teh object returned by GET /api/status endpoint
// Now each property inside corresponds to something Hermes actually returned
export type HermesStatus = {
  version: string;
  // "version": "0.21.4" determines the version of Hermes in charge of the gateway

  gateway_running: boolean;
  // This value indicates whether the Hermes gateway is currently running or not.
  gateway_state: HermesGatewayState;
  // gateway_state: HermesGatewayState; instead of just a string, we reuse the custom type we defined earlier.
  // This means later the UI can do: if (status.gateway_state === "running") { ... }

  // Later the dashboard might display:
  // Active agents: 0
  // Active sessions: 0
  active_agents: number;
  active_sessions: number;

  // gateway_busy tells us whether the Gateway is currently occupied with work.
  gateway_busy: boolean;
  // gateway_drainable indicates whether Hermes considers it possible to gracefully drain/prepare the Gateway for restart or shutdown behavior.
  gateway_drainable: boolean;

  overall: HermesOverallStatus;

  //   real JSON included:
  //     "components": {
  //     "gateway": {...},
  //     "dashboard": {...},
  //     "storage": {...},
  //     "platforms": {...}
  //     } So we create the same nested structure in TypeScript.
  // Each one uses: HermesComponentStatus so we do not repeat the same definition four times.
  components: {
    gateway: HermesComponentStatus;
    dashboard: HermesComponentStatus;
    storage: HermesComponentStatus;
    platforms: HermesComponentStatus;
  };

  gateway_platforms: {
    whatsapp: HermesPlatformStatus;
    api_server: HermesPlatformStatus;
  };

  profiles: string[];

  gateway_mode: string;

  hermes_home: string;
  config_path: string;
  env_path: string;

  gateway_pid: number | null;
};
