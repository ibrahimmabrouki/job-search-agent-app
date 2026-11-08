"use client";
// This component is responsible for displaying the status overview of various services in the control panel dashboard.
// So, It receives the status of Hermes, WhatsApp, Codex, Scheduler and Workspace from the parent component and display them in a grid layout using the HealthCard component.
import {
  Activity,
  CalendarDays,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import type {
  HermesStatus,
  CodexStatus,
  WhatsAppStatus,
  CronJob,
} from "@/types/control-panel/control-panel.types";
import { HealthCard } from "./primitives";

// This is the type that represents the struture of the data passed from any parent component to StatusOverview component.
// It includes the status of Hermes, WhatsApp, Codex, Scheduler and Workspace services and a loading state.
// Note that we are not receiving any callback functions from the parent component because this component is only responsible for displaying the status overview and not for modifying any state in the parent component.
type StatusOverviewProps = {
  hermes: HermesStatus | null;
  whatsapp: WhatsAppStatus | null;
  codex: CodexStatus | null;
  jobs: CronJob[];
  loading: boolean;
  gatewayHealthy: boolean;
};

// Notes:
// 1- This is the strucuter of the CronJob: export type CronJob = { id: string; name: string; prompt: string; enabled: boolean; state: string; schedule_display: string; deliver: string; last_run_at: string | null; next_run_at: string | null; last_status: string | null; last_error: string | null; };

// 2- The gatewayHealthy prop is a boolean the is not defined as state in the parent component but it is derived from another state (hermes)
// -hermes state changes → DashboardManager re-renders → gatewayHealthy is recalculated → React passes the updated value to StatusOverview

export function StatusOverview({
  hermes,
  whatsapp,
  codex,
  jobs,
  loading,
  gatewayHealthy,
}: StatusOverviewProps) {
  // This varaible is filtering the jobs array to count the number of active jobs (enabled = true) and storing it in a variable called activeJobs.
  // For example: const jobs = [ { id: "1", enabled: true, ...other properties }, { id: "2", enabled: false, ...other properties }, { id: "3", enabled: true, ...other properties }, ];
  // ==> activeJobs = 2;
  const activeJobs = jobs.filter((job) => job.enabled).length;

  return (
    <div className="neon-status-grid" aria-label="System health overview">
      {/* HealthCard is a reusable component for displaying the health status of a service
       * - It takes an icon, a label, an active state, and a detail message as props.
       * - The icon is a Lucide React icon.
       * - The label is a string that represents the name of the service.
       * - The active state is a boolean that indicates whether the service is functioning correctly.
       * - The detail message is a string that provides additional information about the service's status.
       * Note:
       * 1- labeL = "value" while detail = {value} because label is a string while detial is a variable that is being calculated so we use the curly braces to indicate that it is a JavaScript expression.
       * 2- The detail prop is javascript expression
       * - if hermes is null, it means the service is unavailable and we display "Unavailable"
       * - if hermes is not null and gatewayHealthy is true, it means the service is connected and healthy and we display "Connected · Healthy"
       * - if hermes is not null and gatewayHealthy is false, it means the service is connected but not healthy and we display the gateway_state value from the hermes object.
       */}
      <HealthCard
        icon={Zap}
        label="Hermes / Gateway"
        active={gatewayHealthy}
        detail={
          !hermes
            ? "Unavailable"
            : gatewayHealthy
              ? "Connected · Healthy"
              : hermes.gateway_state
        }
      />

      {/* Here we have similar props being passed to the HealthCard component
       * - The active prop is a boolean that indicates whether the service is functioning correctly.
       * - The detail prop is a string that provides additional information about the service's status.
       * - If the service is unavailable, we display "Unavailable"
       * - If the service is connected, we display "Connected"
       * - If the service is disconnected, we display "Disconnected" or the state of the service.
       */}
      <HealthCard
        icon={Sparkles}
        label="Codex"
        active={codex?.connected === true}
        detail={
          !codex
            ? "Unavailable"
            : codex.connected
              ? "Connected"
              : "Disconnected"
        }
      />
      {/* Here we have a similar prop being passed to the HealthCard component
       * - The active prop is a boolean that indicates whether the service is functioning correctly.
       * - The detail prop is a string that provides additional information about the service's status.
       * - If the service is unavailable, we display "Unavailable"
       * - If the service is connected, we display "Connected"
       * - If the service is disconnected, we display "Disconnected" or the state of the service.
       */}
      <HealthCard
        icon={MessageCircle}
        label="WhatsApp"
        active={whatsapp?.connected === true}
        detail={
          !whatsapp
            ? "Unavailable"
            : whatsapp.connected
              ? "Connected"
              : whatsapp.state
        }
      />
      {/*
       * SCHEDULER STATUS
       *
       * - active: True when at least one scheduled job is enabled.
       * - warning: True when jobs exist, but none are enabled.
       *   This does not necessarily mean the scheduler is malfunctioning.
       * - detail: Shows "Loading jobs…" during initial loading.
       *   Otherwise, displays the number of enabled and total jobs.
       *
       * Note: "active" means enabled, not currently executing.
       */}
      <HealthCard
        icon={CalendarDays}
        label="Scheduler"
        active={activeJobs > 0}
        warning={jobs.length > 0 && activeJobs === 0}
        detail={
          loading
            ? "Loading jobs…"
            : `${activeJobs} active · ${jobs.length} total`
        }
      />

      {/*
       * WORKSPACE STATUS
       *
       * - active: Currently depends on gatewayHealthy.
       * - detail: "4 configured file paths" is hardcoded.
       *
       * Important:
       * This card does not currently verify whether the workspace
       * files exist or are correctly configured.
       *
       * Later, we should connect it to actual workspace status data.
       */}
      <HealthCard
        icon={Activity}
        label="Workspace"
        active={gatewayHealthy}
        detail="4 configured file paths"
      />
    </div>
  );
}
