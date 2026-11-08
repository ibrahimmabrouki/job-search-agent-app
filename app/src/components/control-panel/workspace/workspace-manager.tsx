"use client";

import { useEffect, useRef, useState } from "react";
import {
  getWorkspaceFile,
  saveWorkspaceFile,
  uploadWorkspaceCv,
} from "@/lib/admin-services/workspace-service";
import type {
  EditableFile,
  FileEditorState,
} from "@/types/control-panel/control-panel.types";
import { WorkspacePanel } from "./workspace-panel";
import FileEditorDialog from "./file-editor-dialog";

// Defines the props received from DashboardManager.
type WorkspaceManagerProps = {
  editProfileOpen: boolean;
  closeEditProfile: () => void;
  uploadCvOpen: boolean;
  closeUploadCv: () => void;
  notify: (text: string, kind: "ok" | "error") => void;
};

// This manager contains only workspace file actions, matching Coffee Shop's admin managers.
export default function WorkspaceManager({
  // Since we have the In the Quick Actions buttons that allow the user to open the profile editor or upload a CV, we need to know when those actions are requested.
  // That's why we receive the editProfileOpen and uploadCvOpen states from the parent component, DashboardManager.
  // When the user clicks the "Edit Profile" button in Quick Actions or the "Upload CV" button, those changes the state in the parent component and we receive the updated state here.
  // So, this leads to re-rendering this component and we can then open the appropriate dialog.
  // This component also receives the closeEditProfile and closeUploadCv callback functions from the parent component to close the dialogs when the user is done with the actions.
  editProfileOpen,
  closeEditProfile,
  uploadCvOpen,
  closeUploadCv,

  // The notify callback function is used to display notifications to the user.
  notify,
}: WorkspaceManagerProps) {
  // To understand more the useRef hook, first we need to understand the File Uploading process in HTML where we will be using the useRef hook

  // The main question is that how does uploading file work in React?
  // In HTML we use an <input type="file" /> element to allow users to select files from their device.
  // type="file" tells the browser to open a file picker dialog
  // Then this selected file can be accessed through the input's files property input.files

  // Note: Selecting a file doesn't automatically upload it to the server. Uploading is a separate operation we'll study later.

  // Now What is the useRef hook?
  // useRef is a React Hook that allows us to keep a reference to something between renders.
  // One common use case is accessing real HTML element
  // Lets break the code down to understand it better:

  // - const fileInputRef = useRef<HTMLInputElement>(null);
  // - useRef: React Hook that creates a persistent reference to a value that survives re-renders.
  // - HTMLInputElement: TypeScript type represeting an HTML <input> element.
  // - null: Initial value of the reference, indicating that it doesn't point to any element yet.
  // - fileInputRef: A variable that holds the reference to the <input> element. We can use this reference to access the input element's properties and methods, like triggering a click event programmatically.

  // React stores the refrenced element in fileInputRef.current

  // How does useRef connect to an input element? conisder the following example:

  // As you can see below that we have the <input> element which is a file input element where if we click on the it it will open the file picker dialog and we can select a file from our device.
  // But if we also want to open the file picker dialog when the user clicks on a button, we can use the useRef hook to get a reference to the input element and the trigger the click event fileInputRef.current?.click() on it when the user clicks the button.
  // The ?. is called optional chaining. It means: call .click() only if fileInputRef.current is not null.

  // export default function Example() {
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // return ( <> <input ref={fileInputRef} type="file" accept=".pdf" />
  // <button type="button" onClick={() => fileInputRef.current?.click()}> Upload CV </button> </> ); }

  // Why do we need useRef instead of using useState?
  // - Since useRef can refrence DOM element while useState can store values used for rendering.
  // - updating .current does not trigger a re-render
  // - useful for opening a file picker dialog without causing unnecessary re-renders of the component.

  // Now lets connect what explained above to the WorkspaceManager Component:
  // - We have, const fileInputRef = useRef<HTMLInputElement>(null);
  // - And this component also passes the fileInputRef to the WorkspacePanel component as a prop, so that the WorkspacePanel can use that reference on the actual file input, allowing the parent to trigger the picker.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This state variable is used to track whether the workspace is currently busy with an operation (Like uploading a CV or saving a file -Agents or Profile-) or not. When busy is true, the UI can disable certain actions to prevent conflicts or errors during ongoing operations.
  // We pass the busy state to the WorkspacePanel and FileEditorDialog components so that they can know about the busy state but we don't pass the setBusy function to them because this is controlled through the other methods in this component (handleUpload, handleSaveFile, openFileEditor) and these methods are passed as fallback function as props to the needed components.
  const [busy, setBusy] = useState(false);

  // This state below stores information about the file currently being edited in the FileEditorDialog.
  // These below what makes up the FileEditorState type:
  // EditableFile = "agents" | "profile";
  // FileEditorState = {
  //   type: EditableFile;
  //   title: string;
  //   content: string;
  // };
  // EditableFile identifies which file is being edited
  // title: The filename displayed in the editor dialog.
  // content: The actual text content of the file being edited.

  // Note: null means no file is currently being edited, so the FileEditorDialog will not be displayed {editor && <FileEditorDialog ... />}
  const [editor, setEditor] = useState<FileEditorState | null>(null);

  // This is the method that is responsible for opening the FileEditorDialog when the user wants to edit a file (Agents or Profile).
  // It takes an argument type of EditableFile which can be either "agents" or "profile"
  // It fetches the content of the file from the backend using getWorkspaceFile and then sets the editor state with the fetched content, title, and type.
  // for example this method will be called from the WorkspacePanel component when the user clicks on the Edit button next to Agent.md row or context/PROFILE row
  // openFileEditor("agents");  // Valid
  // openFileEditor("profile"); // Valid
  // TypeScript would reject openFileEditor("cv"), because "cv" isn't part of EditableFile.

  async function openFileEditor(type: EditableFile) {
    setBusy(true);
    try {
      const file = await getWorkspaceFile(type);
      // When setEditor() updates the state, React re-renders WorkspaceManager. Because editor is no longer null, the FileEditorDialog appears automatically.
      setEditor({
        type,
        content: file.content,
        title: type === "agents" ? "AGENTS.md" : "context/PROFILE.md",
      });
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to read file",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  // User clicks Edit on AGENTS.md ==>WorkspacePanel calls openFileEditor("agents") ==> WorkspaceManager sets busy = true ==> getWorkspaceFile("agents") ==> Backend returns file content ==> setEditor({ type, title, content }) ==> React renders FileEditorDialog

  // This method is responsible for closing the FileEditorDialog whether the user was editing the Agents file or the profile file.
  // It sets the editor state back to null, which causes the FileEditorDialog to disappear.
  // It also calls closeEditProfile() to ensure that if the profile editor was open via Quick Actions, it is also closed.
  // This ensures that the UI remains consitent and that the user is not left with an open dialog when they have finished editing a file.
  function closeEditor() {
    setEditor(null);
    closeEditProfile();
  }

  // This is the most important part which explains how the Quick Actions buttons work with the WorkspaceManager component to open the profile editor
  useEffect(() => {
    // Quick Actions button responsible for opening the profile editor sets editProfileOpen to true in DashboardManager
    // This leads to re-rendering the WorkspaceManager component and since this useEffect is triggered once this component renders, it checks if editProfileOpen is true and then calls openFileEditor("profile") to open the profile editor dialog.
    if (editProfileOpen) {
      void openFileEditor("profile");
    }
    // The request flag is only changed by Quick Actions; a manual editor is independent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProfileOpen]);

  // User clicks Edit Profile in DashboardManager ==> setEditingProfile(true) ==> DashboardManager re-renders ==> WorkspaceManager receives editProfileOpen={true} ==> useEffect detects the change ==> openFileEditor("profile") ==> Profile contents are fetched ==> setEditor(...) ==> FileEditorDialog appears

  useEffect(() => {
    // The Quick Actions button responsible for opening the CV upload dialog sets uploadCvOpen to true in DashboardManager
    // This leads to re-rendering the WorkspaceManager component and since this useEffect is triggered once this component renders, it checks if uploadCvOpen is true and then triggers the click event on the hidden file input element to open the file picker dialog.

    if (uploadCvOpen) {
      fileInputRef.current?.click();
      closeUploadCv();
    }
  }, [uploadCvOpen, closeUploadCv]);

  // This method is responsible for saving the content of the file being edited in the FileEditorDialog.
  // It checks if there is an active editor
  async function handleSaveFile() {
    // Remember that editor can be either FileEditorState or null.
    // If no file is open, there is nothing to save. This condition also tells TypeScript that editor is not null in the remaining code.
    if (!editor) return;
    setBusy(true);
    try {
      await saveWorkspaceFile(editor.type, editor.content);
      notify(`${editor.title} saved.`, "ok");
      closeEditor();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save file",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  // This method is responsible for handling the file upload process when the user selects a file through the file input element.
  // It takes an optional File object as an argument, which represents the file selected by the user.
  // If no file is provided (the user cancels the file selection), the function simply returns without doing anything.
  // - ?: The file is optional, meaning it may be undefined.
  async function handleUpload(file?: File) {
    if (!file) return;

    // This updates the loading state so the UI can disable workspace actions during the upload.
    setBusy(true);
    try {
      // uploadWorkspaceCv() is a separate frontend service function that sends the selected file to our backend.
      await uploadWorkspaceCv(file);
      // If successful
      notify("CV uploaded.", "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to upload CV",
        "error",
      );
    } finally {
      // setBusy(false) re-enables workspace actions.
      setBusy(false);

      // Clearing the selection is particularly useful because it allows selecting the same PDF again and triggering onChange after an upload attempt.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }
  // User clicks Upload CV ==> useRef opens the file picker ==> User selects a PDF ==> onChange gets the File object ==> WorkspacePanel calls uploadCv(file) ==> WorkspaceManager.handleUpload(file) ==> uploadWorkspaceCv(file) ==> Backend upload request

  return (
    <>
      {/* This is the WorkspacePanel component that is used to display the workspace files and the actions we can perform on them
       * - It receives the fileInputRef, to be used in the file input element to trigger the file picker dialog when the user clicks on the "Upload CV" button.
       * - So, the WorkspaceManager component creates the fileInputRef and passes it down to the WorkspacePanel component as a prop
       * - This allows both components to access the same HTML element
       */}
      <WorkspacePanel
        fileInputRef={fileInputRef}
        uploadCv={handleUpload}
        openFileEditor={openFileEditor}
        busy={busy}
      />
      {editor && (
        <FileEditorDialog
          file={editor}
          busy={busy}
          onChange={(content) =>
            setEditor((current) => (current ? { ...current, content } : null))
          }
          onClose={closeEditor}
          onSave={handleSaveFile}
        />
      )}
    </>
  );
}
