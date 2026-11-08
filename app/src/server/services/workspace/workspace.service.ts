import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { WORKSPACE_FILES } from "@/server/constants/workspace.constants";
import type {
  HermesFileReadResponse,
  HermesFileWriteResponse,
  HermesFileUploadResponse,
} from "@/types/workspace/workspace.types";

export class WorkspaceService {
  // Reads AGENTS.md from the persistent Hermes workspace.
  // AGENTS.md contains the Job Search Agent's instructions, including job priorities, locations, technologies, experience requirements, and filtering rules.
  //
  // Flow: WorkspaceService → HermesClient → GET /api/files/read?path=/opt/data/workspace/AGENTS.md
  // Hermes returns the file content encoded in Base64.
  // We decode it into a UTF-8 string for our application.
  // The file path is fixed by the backend.
  // Users cannot request arbitrary filesystem paths.

  public async getAgentsInstructions(): Promise<string> {
    const hermesClient = createHermesClient();

    const query = new URLSearchParams({
      path: WORKSPACE_FILES.AGENTS,
    });

    const file = await hermesClient.get<HermesFileReadResponse>(
      `/api/files/read?${query.toString()}`,
    );

    const encodedContent = file.data_url.split(",")[1];

    return Buffer.from(encodedContent, "base64").toString("utf-8");
  }

  /**
   * Creates or updates the Job Search Agent's AGENTS.md file.
   *
   * AGENTS.md defines how the agent should search for jobs,
   * including role priorities, locations, experience levels,
   * technologies, freshness rules, and duplicate handling.
   *
   * Flow:
   * WorkspaceService → HermesClient
   * → POST /api/fs/write-text
   *
   * Hermes receives:
   * {
   *   path: "/opt/data/workspace/AGENTS.md",
   *   content: "Job search instructions..."
   * }
   *
   * Important:
   * - The file path is fixed by our backend.
   * - The user can change the instructions, not the file path.
   * - Hermes creates the file if it doesn't exist.
   * - Existing content is replaced with the new content.
   * - Hermes uses atomic file replacement for safer updates.
   *
   * Returns the result of the file-writing operation.
   */
  public async updateAgentsInstructions(
    content: string,
  ): Promise<HermesFileWriteResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.post<HermesFileWriteResponse>("/api/fs/write-text", {
      path: WORKSPACE_FILES.AGENTS,
      content,
    });
  }

  /**
   * Reads the candidate's PROFILE.md from the persistent workspace.
   *
   * PROFILE.md contains the candidate's education,
   * technical skills, work experience, and projects.
   *
   * Hermes uses this information to evaluate how well
   * job opportunities match the candidate.
   *
   * Flow:
   * WorkspaceService → HermesClient
   * → GET /api/files/read
   *
   * Returns the profile content as a UTF-8 string.
   */
  public async getCandidateProfile(): Promise<string> {
    const hermesClient = createHermesClient();

    const query = new URLSearchParams({
      path: WORKSPACE_FILES.PROFILE,
    });

    const file = await hermesClient.get<HermesFileReadResponse>(
      `/api/files/read?${query.toString()}`,
    );

    const encodedContent = file.data_url.split(",")[1];

    return Buffer.from(encodedContent, "base64").toString("utf-8");
  }

  /**
   * Creates or updates the candidate's PROFILE.md file.
   *
   * PROFILE.md contains the candidate's information:
   * - Education and qualifications
   * - Technical skills
   * - Work experience
   * - Projects and relevant technologies
   *
   * The frontend sends the profile as text (JSON content),
   * not as an uploaded file.
   *
   * Flow:
   * WorkspaceService → HermesClient
   * → POST /api/fs/write-text
   *
   * Important:
   * - The file path is fixed by the backend.
   * - If PROFILE.md doesn't exist, Hermes creates it.
   * - If PROFILE.md exists, Hermes replaces its content.
   * - The file is stored in Docker's persistent workspace.
   *
   * Returns Hermes' file-writing response.
   */
  public async updateCandidateProfile(
    content: string,
  ): Promise<HermesFileWriteResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.post<HermesFileWriteResponse>("/api/fs/write-text", {
      path: WORKSPACE_FILES.PROFILE,
      content,
    });
  }

  /**
   * Uploads or replaces the candidate's CV PDF.
   *
   * The frontend sends an actual PDF file, not JSON text.
   *
   * Flow:
   * WorkspaceService → HermesClient.uploadCv()
   * → POST /api/files/upload-stream
   * → /opt/data/workspace/CV.pdf
   *
   * Important:
   * - The destination is fixed by the backend.
   * - Only PDF files are accepted.
   * - Files larger than 10 MB are rejected.
   * - Existing CV.pdf is replaced when uploading a new CV.
   * - Hermes saves the file in persistent Docker storage.
   */
  public async uploadCandidateCv(
    file: File,
  ): Promise<HermesFileUploadResponse> {
    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed.");
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size === 0 || file.size > maxSize) {
      throw new Error("CV must be between 1 byte and 10 MB.");
    }

    const signature = new TextDecoder().decode(
      await file.slice(0, 5).arrayBuffer(),
    );

    if (signature !== "%PDF-") {
      throw new Error("Invalid PDF file.");
    }

    const formData = new FormData();

    formData.append("file", file, "CV.pdf");
    formData.append("path", WORKSPACE_FILES.CV);
    formData.append("overwrite", "true");

    const hermesClient = createHermesClient();

    return hermesClient.uploadCv<HermesFileUploadResponse>(formData);
  }
}

export const createWorkspaceService = () => new WorkspaceService();
