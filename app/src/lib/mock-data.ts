import type { AgentFile, StatusItem } from "@/types/dashboard";

export const statusItems: StatusItem[] = [
  { id: "hermes", label: "Hermes", subtitle: "Agent runtime", state: "running" },
  { id: "codex", label: "Codex", subtitle: "AI model access", state: "connected" },
  { id: "whatsapp", label: "WhatsApp", subtitle: "Job delivery", state: "connected" },
  { id: "scheduler", label: "Scheduler", subtitle: "Automated scans", state: "active" },
];

export const agentFiles: AgentFile[] = [
  { name: "AGENTS.md", description: "Job-search rules, matching logic, and agent instructions.", action: "Edit", kind: "markdown" },
  { name: "PROFILE.md", description: "Your experience, skills, locations, and role preferences.", action: "Edit", kind: "markdown" },
  { name: "CV.pdf", description: "Primary CV used when validating experience and job fit.", action: "Replace", kind: "pdf" },
];

export const recentLogs = [
  "Hermes runtime is ready",
  "Codex connection detected",
  "WhatsApp connection detected",
  "Scheduler loaded successfully",
];
