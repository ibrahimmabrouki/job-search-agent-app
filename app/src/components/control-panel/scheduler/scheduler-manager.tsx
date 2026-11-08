"use client";

import { useState } from "react";
import {
  createSchedulerJob,
  updateSchedulerJob,
  runSchedulerJob,
} from "@/lib/admin-services/scheduler-service";
import type {
  CronJob,
  JobEditorState,
  JobForm,
} from "@/types/control-panel/control-panel.types";
import { NEW_JOB } from "@/types/control-panel/control-panel.types";
import { SchedulerPanel } from "./scheduler-list";
import JobDialog from "./job-dialog";

type SchedulerManagerProps = {
  // Defines the props received from DashboardManager.
  jobs: CronJob[];
  loading: boolean;
  selectedJobId: string;
  // Updates the selected job in the parent which is selectedJobId in DashboardManager. This is a callback function that is passed down to SchedulerPanel to handle job selection.
  onSelectJob: (id: string) => void;

  // This describes a function that takes no arguments and returns a Promise.
  // Why? Because refresh() performs asynchronous work, such as fetching scheduled jobs from the backend.
  // We can therefore use: await refresh();
  // This allows us to wait for the updated dashboard data.
  refresh: () => Promise<void>;
  notify: (text: string, kind: "ok" | "error") => void;
  createJobOpen: boolean;
  openCreateJob: () => void;
  closeCreateJob: () => void;
};

export default function SchedulerManager({
  jobs,
  loading,
  selectedJobId,
  onSelectJob,
  refresh,
  notify,
  createJobOpen,
  openCreateJob,
  closeCreateJob,
}: SchedulerManagerProps) {
  // This busy useState is used to indicate whether a scheduler operation is in progress.
  // It sets the busy state to true when an operation starts and sets it back to false when the operation completes.

  // How busy is used:
  // 1. When the user clicks "Save" in the JobDialog, busy is set to true while the job is being created or updated.
  // 2. When the user clicks "Pause", "Resume", or "Trigger" in the SchedulerPanel, busy is set to true while the operation is being performed.
  // 3. While busy is true, the UI can show a loading indicator and disable buttons to prevent multiple operations from being triggered simultaneously.

  // And this is becuase this component is sending the busy state to the child components (SchedulerPanel and JobDialog) as a prop so that they can use it to disable buttons and show loading indicators while an operation is in progress.
  // We store busy state in this parent component since more than one dialog needs to use it.
  const [busy, setBusy] = useState(false);

  // This state is used in the process of how the SchedulerManager stores tge job currently being edited.
  // These are below the types that will be used to represent the editingJob state
  //   export type JobForm = {
  //   name: string;
  //   schedule: string;
  //   prompt: string;
  //   deliver: "whatsapp" | "local"; };

  // export type JobEditorState = {
  //   id?: string;
  //   form: JobForm; };

  // id	string (optional)	Identifies an existing scheduled job
  // form	JobForm	Stores the information entered in the job form

  // Why the id is optional?
  // Since the same JobDialog component is used for both creating a new job and editing an existing job, the id is optional. When creating a new job, there is no existing job id, so the id property is omitted. When editing an existing job, the id property is included to identify which job is being edited.

  // It is initilalized null since there is no existing job currently being edited
  // when the user click on the edit button of an existing job, the openExistingJob function is called and it sets the editingJob state to the job being edited.
  // One important distinction is that editingJob stores a job being edited, but it is not the only thing controlling whether JobDialog appears.
  const [editingJob, setEditingJob] = useState<JobEditorState | null>(null);

  // this is called a derived value since it allows the dialog ti support both creating and editing a job. It is derived from the editingJob state and the createJobOpen prop.
  // First: What is ???
  // The ?? operator is called the nullish coalescing operator.
  // It returns the value on the left unless that value is null or undefined.

  // Second: How is it used here?
  // If editingJob is not null, then editor will be set to editingJob.
  // If editingJob is null, then editor will be set to { form: { ...NEW_JOB } } if createJobOpen is true, otherwise it will be set to null.

  // What is { ...NEW_JOB }?
  // NEW_JOB contains the default form values for creating a scheduled job.
  // The spread operator (...) creates a new object containing those values.

  // This allows the JobDialog to support both creating a new job and editing an existing job.
  const editor =
    editingJob ?? (createJobOpen ? { form: { ...NEW_JOB } } : null);

  // Tracks which job is currently being triggered.
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  // This function is called when the user clicks the "+ Create Job" button in the SchedulerPanel. It sets the editingJob state to null since now we dont want the old data to be displayed in the JobDialog and then it calls openCreateJob() to open the JobDialog
  // Calling openCreateJob() sets the createJobOpen state in the parent component (DashboardManager) to true, which causes the component to re-render then the SchedulerManager component will re-render and since createJobOpen is now true, the derived value editor will be set to { form: { ...NEW_JOB } } and the JobDialog will appear with the default form values for creating a new job.
  // User clicks Create Job ==> handleOpenNewJob() ==> setEditingJob(null) ==> Clears any previously edited job ==> openCreateJob() ==> Sets the parent's creatingJob state to true ==> JobDialog appears with the new-job form
  function handleOpenNewJob() {
    setEditingJob(null);
    openCreateJob();
  }

  // This function is called when the user clicks on the edit button next to the job in the SchedulerPanel.
  // It sets the editingJob state to the job being edited, which causes the re-render of the SchedulerManager component.
  // Since editingJob is no longer null, the derived value editor will be set to editingJob and the JobDialog will appear with the form pre-filled with the job's existing data.
  // User clicks Edit on a scheduled job ==> openExistingJob(job) ==> closeCreateJob() Resets the parent's creation request ==> setEditingJob({ id, form }) Stores the selected job's information ==> JobDialog opens with the existing job's values
  function openExistingJob(job: CronJob) {
    closeCreateJob();
    setEditingJob({
      id: job.id,
      form: {
        name: job.name,
        prompt: job.prompt,
        schedule: job.schedule_display || "every 24h",
        deliver: job.deliver === "whatsapp" ? "whatsapp" : "local",
      },
    });
  }

  // This function is called when the user clicks the "Cancel" button in the JobDialog or when the job is successfully saved.
  // It sets the editingJob state back to null, which causes the JobDialog to disappear.
  // It also calls closeCreateJob() to ensure that if the JobDialog was opened for creating a new job, it is also closed.
  // This ensures that the UI remains consistent and that the user is not left with an open dialog when they have finished editing or creating a job.

  // User clicks Cancel or closes JobDialog ==> closeEditor() ==> setEditingJob(null) - Clears the selected job and unsaved edits ==> closeCreateJob() - Resets DashboardManager's creation request ==> React re-renders and removes JobDialog - Because editor becomes null
  function closeEditor() {
    setEditingJob(null);
    closeCreateJob();
  }

  // This method is called when the user makes changes to the job form in the JobDialog. It updates the editingJob state with the new form values while preserving the existing job id (if any). This allows the user to see their changes reflected in real-time as they edit the job form.
  // It takes a JobForm object as an argument, which contains the updated values for the job's name, schedule, prompt, and delivery method.
  // User edits the job form in JobDialog ==> updateForm(form) ==> setEditingJob((current) => (current ? { ...current, form } : { form })) Updates the editingJob state with the new form values while preserving the existing job id (if any)
  function updateForm(form: JobForm) {
    setEditingJob((current) => (current ? { ...current, form } : { form }));
  }

  async function handleSaveJob() {
    // If editor is null, it means there is no job currently being edited or created
    if (!editor) {
      return;
    }

    const { form, id } = editor;
    if (!form.name.trim() || !form.schedule.trim() || !form.prompt.trim()) {
      notify("Job name, schedule, and prompt are required.", "error");
      return;
    }
    setBusy(true);
    try {
      // The id in the editor state is optional based on the type definition of JobEditorState.
      // If id is present, it means the user is editing an existing job, so we call updateSchedulerJob to update the job with the new form values.
      if (id) {
        await updateSchedulerJob(id, form);
      }

      // If id is not present, it means the user is creating a new job, so we call createSchedulerJob to create a new job with the form values.
      else {
        await createSchedulerJob(form);
      }

      // After successfully saving the job (either creating a new job or updating an existing one), we close the JobDialog by calling closeEditor(), refresh the list of jobs by calling refresh(), and display a success notification to the user using notify().
      closeEditor();
      await refresh();
      notify(id ? "Job updated." : "Job created in paused state.", "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save job",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  // This method is used to perform actions or operations on existing scheduled jobs, such as pausing, resuming, or triggering a job to run immediately.
  // It takes two arguments: jobId (the unique identifier of the job) and action (the type of action to perform, which can be "pause", "resume", or "trigger").
  // It sets the busy state to true while the operation is in progress.
  // It calls the runSchedulerJob function to perform the action on the backend, refreshes the list of jobs, and displays a notification indicating the result of the operation.
  // If an error occurs during the operation, it displays an error notification.

  // "pause"	Disable automatic execution of a scheduled job
  // "resume"	Re-enable automatic execution
  // "trigger"	Request an immediate execution

  // User clicks Pause / Resume / Run Now ==> handleJobAction(jobId, action) ==> setBusy(true) ==> runSchedulerJob(jobId, action) ==> Backend sends request to Hermes ==> refresh() updates dashboard information ==> notify() displays the result ==> setBusy(false)
  async function handleJobAction(
    jobId: string,
    action: "pause" | "resume" | "trigger",
  ) {
    const isTrigger = action === "trigger";

    if (isTrigger) {
      setRunningJobId(jobId);
    } else {
      setBusy(true);
    }

    try {
      await runSchedulerJob(jobId, action);
      await refresh();

      notify(
        action === "pause"
          ? "Job paused."
          : action === "resume"
            ? "Job resumed."
            : "Hermes handled the run request. Check job history and WhatsApp for the outcome.",
        "ok",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Job action failed",
        "error",
      );
    } finally {
      if (isTrigger) {
        setRunningJobId(null);
      } else {
        setBusy(false);
      }
    }
  }

  return (
    <>
      {/* SchedulerPanel is responsible for displaying scheduled jobs and providing buttons for users to interact with them.
        * Its responsibilities include:
        - Displaying the list of scheduled jobs in a table.
        - Showing each job's status, schedule, delivery method, and execution dates.
        - Allowing users to select a job.
        - Providing Create, Edit, Pause, Resume, and Run Now buttons.

        * Importantly, SchedulerPanel does not directly call the backend. It uses callback functions supplied by SchedulerManager.
        * The props passed to SchedulerPanel include:
        * - jobs: The list of scheduled jobs to display which is recieved from the DashboardManager Component.
        * - loading: A boolean indicating whether the job data is still being fetched and this is also passed from the DashboardManager.
        * - busy: A boolean indicating whether a job operation is in progress. This is managed by SchedulerManager and passed down to SchedulerPanel.
        * - selectedJobId: The id of the currently selected job, which is managed by DashboardManager and passed down to SchedulerPanel.
        * - setSelectedJobId: A callback function that updates the selected job in the parent component (DashboardManager). This allows SchedulerPanel to notify the parent when a user selects a different job.
        * - openNewJob: A callback function that opens the JobDialog for creating a new job. This is managed by SchedulerManager and passed down to SchedulerPanel.
        * - openExistingJob: A callback function that opens the JobDialog for editing an existing job. This is managed by SchedulerManager and passed down to SchedulerPanel.
        * - runJobOperation: A callback function that performs actions on existing jobs (pause, resume, trigger). This is managed by SchedulerManager and passed down to SchedulerPanel.

       */}
      <SchedulerPanel
        jobs={jobs}
        loading={loading}
        busy={busy}
        runningJobId={runningJobId}
        selectedJobId={selectedJobId}
        setSelectedJobId={onSelectJob}
        openNewJob={handleOpenNewJob}
        openExistingJob={openExistingJob}
        runJobOperation={handleJobAction}
      />

      {/* The editor is a derived value that allows the dialog to support both creating and editing a job.
       * - When editor is null, the dialog isn't rendered.
       * - When editor contains a job form, the dialog appears.
       * Important: The derived value determines which form the dialog receives, while editingJob stores changes made during editing.
       */}
      {editor && (
        <JobDialog
          editor={editor}
          busy={busy}
          onClose={closeEditor}
          onChange={updateForm}
          onSave={handleSaveJob}
        />
      )}
    </>
  );
}
