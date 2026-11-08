import type { EditableFile } from "@/types/control-panel/control-panel.types";

export async function getWorkspaceFile(
  file: EditableFile,
): Promise<{ content: string }> {
  const response = await fetch(`/api/v1/workspace/${file}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Unable to read file");
  return data as { content: string };
}

export async function saveWorkspaceFile(
  file: EditableFile,
  content: string,
): Promise<void> {
  const response = await fetch(`/api/v1/workspace/${file}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Unable to save file");
  }
}

export async function uploadWorkspaceCv(file: File): Promise<void> {
  if (
    (file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")) ||
    !file.size ||
    file.size > 10 * 1024 * 1024
  ) {
    throw new Error("Choose a nonempty PDF no larger than 10 MB.");
  }
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/v1/workspace/cv", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Unable to upload CV");
  }
}
