//Allowed Job Search Agent workspace files.
// All paths are fixed by the backend.
// Users must never provide arbitrary filesystem paths.
// These files live inside Docker's persistent volume.
export const WORKSPACE_FILES = {
  AGENTS: "/opt/data/workspace/AGENTS.md",
  PROFILE: "/opt/data/workspace/context/PROFILE.md",
  CV: "/opt/data/workspace/context/IbrahimMabrouki-UAE.pdf",
  JOB_HISTORY: "/opt/data/workspace/data/job_history.json",
} as const;
