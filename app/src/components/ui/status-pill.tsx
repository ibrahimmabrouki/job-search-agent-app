import type { ServiceState } from "@/types/dashboard";

const labels: Record<ServiceState, string> = {
  connected: "Connected",
  running: "Running",
  active: "Active",
  healthy: "Healthy",
  disconnected: "Not connected",
  stopped: "Stopped",
  inactive: "Inactive",
};

export function StatusPill({ state }: { state: ServiceState }) {
  const positive = ["connected", "running", "active", "healthy"].includes(state);
  return (
    <span className={`status-pill ${positive ? "status-positive" : "status-muted"}`}>
      <span className="status-dot" />
      {labels[state]}
    </span>
  );
}
