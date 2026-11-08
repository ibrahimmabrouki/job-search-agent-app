"use client";

import {
  CloudUpload,
  FileJson,
  FilePenLine,
  FileText,
  Folder,
  Upload,
} from "lucide-react";
import type { EditableFile } from "@/types/control-panel/control-panel.types";
import { SectionHeader } from "../primitives";

export function WorkspacePanel({
  fileInputRef,
  uploadCv,
  openFileEditor,
  busy,
}: {
  // here we are receiving the fileInputRef from the parent component (WorkspaceManager) as a prop, so that we can use it to reference the actual file input element in the DOM and trigger the file picker dialog when the user clicks on the "Upload CV" button.
  fileInputRef: { current: HTMLInputElement | null };

  // This is the fallback method that is recieved from the parent component (WorkspaceManager) as a prop to give the WorkspacePanel component the ability to upload a CV file when the user selects a file through the file input element.
  uploadCv: (file?: File) => Promise<void>;
  openFileEditor: (file: EditableFile) => Promise<void>;
  busy: boolean;
}) {
  return (
    <section id="workspace" className="neon-panel neon-workspace">
      <SectionHeader
        icon={Folder}
        title="Workspace"
        description="Managed files and agent context."
      >
        <button
          className="neon-btn subtle"
          disabled={busy}
          type="button"
          // Here we are using the onClick event to trigger the click event on the hidden file input element, which will open the file picker dialog for the user to select a file to upload.
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={15} /> Upload CV
        </button>
      </SectionHeader>
      <input
        // Here we are using the fileInputRef to reference the actual file input element in the DOM, so that we can trigger the click event on it when the user clicks on the "Upload CV" button.
        // So, ref = {fileInputRef} is used to connect the react referencce to the HTML input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        aria-label="Choose replacement CV PDF"
        // In the previous steps we have understood how the useRef opens the browser's file picker, now we need to understand what happens after the user selects a PDF file.

        // onChange is also a React event handler and React executes this function when the user selects a file through the input
        // So, onChange receive a method that takes the event as an arguement and executes it when the user selects a file
        // event includes information about what happend <==> React provides an event object containing detials about the input interaction, including the selected file(s).
        // event.currentTarget: This property referes to the element that triggered the event, which is the <input> element in this case.
        // event.currentTarget.files: For file inputs, files contains a FileList of selected files.

        // The [0] means the first item because JavaScript arrays and array-like collections use zero-based indexing.
        // The ?. safely handles cases where files is null.

        // After knowing the the file through the event.currentTarget.files?.[0], we can pass it to the uploadCv method that takes a file as an arguement and uploads it to the server.

        // User selects MyCV.pdf ==> onChange receives the event ==> event.currentTarget.files?.[0] ==> uploadCv(file) ==> WorkspaceManager.handleUpload(file)

        onChange={(event) => void uploadCv(event.currentTarget.files?.[0])}
      />
      <div className="neon-files">
        <div className="neon-file">
          <div className="neon-file-icon">
            <FileText size={22} />
          </div>
          <div className="neon-file-details">
            <strong>AGENTS.md</strong>
            <span>Job-search rules &amp; agent behavior.</span>
          </div>
          <button
            type="button"
            className="neon-file-action"
            disabled={busy}
            onClick={() => void openFileEditor("agents")}
          >
            <FilePenLine size={15} /> Edit
          </button>
        </div>
        <div className="neon-file">
          <div className="neon-file-icon">
            <FileText size={22} />
          </div>
          <div className="neon-file-details">
            <strong>context/PROFILE.md</strong>
            <span>Professional profile &amp; preferences.</span>
          </div>
          <button
            type="button"
            className="neon-file-action"
            disabled={busy}
            onClick={() => void openFileEditor("profile")}
          >
            <FilePenLine size={15} /> Edit
          </button>
        </div>
        <div className="neon-file">
          <div className="neon-file-icon pdf">
            <FileText size={22} />
          </div>
          <div className="neon-file-details">
            <strong>context/IbrahimMabrouki-UAE.pdf</strong>
            <span>Primary CV used for evaluation.</span>
          </div>
          <button
            type="button"
            className="neon-file-action"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload size={15} /> Replace
          </button>
        </div>
        <div className="neon-file">
          <div className="neon-file-icon json">
            <FileJson size={22} />
          </div>
          <div className="neon-file-details">
            <strong>data/job_history.json</strong>
            <span>Search history and repost tracking.</span>
          </div>
          <span
            className="neon-readonly"
            title="History is managed by the agent; viewing API is not implemented"
          >
            Agent-managed
          </span>
        </div>
      </div>
    </section>
  );
}
