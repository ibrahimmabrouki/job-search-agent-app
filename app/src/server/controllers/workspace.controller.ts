import "server-only";

import { createWorkspaceService } from "@/server/services/workspace/workspace.service";
import type {
  HermesFileWriteResponse,
  HermesFileUploadResponse,
} from "@/types/workspace/workspace.types";

/**
 * Retrieves the Job Search Agent's instructions
 * from AGENTS.md in the persistent Docker workspace.
 */
export const getAgentsInstructions = async (): Promise<string> => {
  const workspaceService = createWorkspaceService();

  return workspaceService.getAgentsInstructions();
};

/**
 * Creates or updates AGENTS.md.
 *
 * The content contains the agent's job-search rules,
 * including roles, locations, technologies, and filtering.
 *
 * Only the file content can be changed.
 * The file path is fixed inside WorkspaceService.
 */
export const updateAgentsInstructions = async (
  content: string,
): Promise<HermesFileWriteResponse> => {
  const workspaceService = createWorkspaceService();

  return workspaceService.updateAgentsInstructions(content);
};

/**
 * Retrieves the candidate's PROFILE.md content.
 *
 * Flow:
 * Controller → WorkspaceService → HermesClient → Hermes
 *
 * Returns the candidate profile as plain text.
 */
export const getCandidateProfile = async (): Promise<string> => {
  const workspaceService = createWorkspaceService();

  return workspaceService.getCandidateProfile();
};

/**
 * Creates or updates the candidate's PROFILE.md.
 *
 * The frontend sends the profile as text content.
 * Hermes creates the file if it doesn't exist,
 * or replaces its contents if it already exists.
 *
 * The file path is fixed inside WorkspaceService.
 */
export const updateCandidateProfile = async (
  content: string,
): Promise<HermesFileWriteResponse> => {
  const workspaceService = createWorkspaceService();

  return workspaceService.updateCandidateProfile(content);
};

/**
 * Uploads or replaces the candidate's CV PDF.
 *
 * The frontend sends an actual PDF file.
 *
 * Flow:
 * Next.js API Route
 * → WorkspaceController
 * → WorkspaceService.uploadCandidateCv()
 * → HermesClient.uploadCv()
 * → Hermes file upload API
 *
 * The WorkspaceService validates the PDF and enforces
 * the fixed destination: /opt/data/workspace/CV.pdf.
 *
 * Returns Hermes' upload confirmation.
 */
export const uploadCandidateCv = async (
  file: File,
): Promise<HermesFileUploadResponse> => {
  const workspaceService = createWorkspaceService();

  return workspaceService.uploadCandidateCv(file);
};
