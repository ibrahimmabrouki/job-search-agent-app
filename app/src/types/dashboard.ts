export type ServiceState = "connected" | "running" | "active" | "healthy" | "disconnected" | "stopped" | "inactive";

export interface StatusItem {
  id: string;
  label: string;
  subtitle: string;
  state: ServiceState;
}

export interface AgentFile {
  name: string;
  description: string;
  action: "Edit" | "Replace";
  kind: "markdown" | "pdf";
}
