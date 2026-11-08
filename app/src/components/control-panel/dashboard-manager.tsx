// This is the main component for the Control Panel Dashboard page.
// This component is rendered inside the Home component, which is the default export of app/src/app/page.tsx.
// This component is responsible for coordinating the various managers and services that make up the Control Panel Dashboard page.

// It has three main responsibilities:
// 1. Manage state: Store Hermes, Codex, WhatsApp, and Scheduler data.
// 2. Fetch data: Request information from backend services.
// 3. Render components: Display the Sidebar, Connections, Workspace, Scheduler, etc.

// This tells Next.js that the component needs to run in the browser.
"use client";

// These are the react hooks that we need to manage state and lifecycle events in this component.
// useState	Stores values that can change	WhatsApp connected/disconnected
// useEffect	Executes logic after rendering	Load statuses when the page opens
// useCallback Keeps a function reference stable between renders	Our refresh() function
import { useCallback, useEffect, useState } from "react";

// These are the client-side services that we use to fetch the Hermes, Codex, WhatsApp and Scheduler data from the backend.

// This below is used to fetch the Hermes status from the backend.
import { getHermesStatus } from "@/lib/admin-services/hermes-service";

// This below is used to fetch the Codex status from the backend.
import { getCodexStatus } from "@/lib/admin-services/codex-service";

// This below is used to fetch the WhatsApp status from the backend.
import { getWhatsAppStatus } from "@/lib/admin-services/whatsapp-service";

// This below is used to fetch the Scheduled jobs and their details from the backend.
import {
  getSchedulerJobs,
  runSchedulerJob,
} from "@/lib/admin-services/scheduler-service";

// These are the types that we use to type the state variables in this component.
// Each of these types id defined to represent the data structure of the Hermes, Codex, WhatsApp and Scheduler data that we fetch from the backend.

// For example: type WhatsAppStatus = { connected: boolean; state: string; errorMessage?: string | null; };
// connected: true or false.
// state: a string, such as "connected".
// errorMessage: an optional error message.

// Why do we need these types?
// In the WhatsAppStatus example, if the backend returns an unexpected value inside the object, TypeScript will throw an error and we can catch it early.
// For example, if the backend returns { connected: "yes", state: "connected" }, TypeScript will throw an error because connected is not a boolean.
import type {
  CodexStatus,
  CronJob,
  HermesStatus,
  Notice,
  WhatsAppStatus,
} from "@/types/control-panel/control-panel.types";

// 	Displays dashboard navigation
import { Sidebar } from "./sidebar";

// Displays the page title, refresh button, and notifications
import { DashboardHeader } from "./dashboard-header";

// Displays system status cards
import { StatusOverview } from "./status-overview";

// Displays recent scheduler activity
import { ActivityPanel } from "./activity-panel";

// Displays shortcuts for common operations
import { QuickActions } from "./quick-actions";

// Manages Hermes, Codex, and WhatsApp interactions
import ConnectionsManager from "./connections/connections-manager";

// Manages scheduled jobs
import SchedulerManager from "./scheduler/scheduler-manager";

// Manages AGENTS.md, PROFILE.md, and CV uploads
import WorkspaceManager from "./workspace/workspace-manager";

// Defining the component
export default function DashboardManager() {
  // Here are the states that we use in order to store the Hermes, Codex, WhatsApp and Schduler data that we fetch from the backend. We also store other states such as loading, refreshing, unavailable, notice, activeSection, creatingJob, editingProfile, uploadingCv and runningJob.

  // hermes: Current Hermes status
  // setHermes: Function to update that status
  // HermesStatus: \| null	Either a Hermes status object or null
  // (null): Initial value before loading
  // For example after recieving the Hermes status from the backend =>
  // setHermes({ version: "1.0", gateway_running: true, gateway_state: "running", overall: "ok", active_sessions: 1, });
  const [hermes, setHermes] = useState<HermesStatus | null>(null);

  // The below follows exactly the same principle, but each stores its respective connection status.
  const [codex, setCodex] = useState<CodexStatus | null>(null);
  const [whatsapp, setWhatsApp] = useState<WhatsAppStatus | null>(null);

  // Here the differece we are storing the scheduler jobs in an array of CronJob
  // Later for example we will use setJobs([job1, job2]); after fetching the jobs from the backend.
  const [jobs, setJobs] = useState<CronJob[]>([]);

  // This state is responsible for storing the currently selected job id, which is currently selected by the user in the dashboard.
  // This is used for example when the user wants to trigger a job, we will use this state to know which job to trigger.
  // Suppose that we have jobs with ids "job1", "job2" and "job3", if the user selects "job2", we will setSelectedJobId("job2") and later when the user clicks on the trigger button, we will use selectedJobId to know which job to trigger.
  // In DashboardManager and the QuickActions component we will send the selectedJobId state to them so that:
  // SchedulerManager uses it to identify and highlight the selected job.
  // QuickActions uses it to know which job to trigger when you click Trigger Job.
  const [selectedJobId, setSelectedJobId] = useState("");

  // This is the stat that we use to store the loading state of the dashboard, which is true when the dashboard is loading and false when it is not.
  // Initially, loading is true because the frontend hasn't finished retrieving information from our backend.
  // These components can display loading messages instead of immediately displaying empty data.
  const [loading, setLoading] = useState(true);

  // This is similar to loading, but serves a different purpose.
  // loading: Is the initial data load complete?
  // refreshing: Is a refresh request currently in progress?

  // Later in our refresh() function, you'll find:
  // setRefreshing(true);
  // Request information from our APIs...
  // setRefreshing(false);

  // It used for example in the following components:
  // <DashboardHeader refreshing={refreshing} />
  // <ConnectionsManager refreshing={refreshing} />
  // <ActivityPanel refreshing={refreshing} />
  const [refreshing, setRefreshing] = useState(false);

  // This is the state that we use to store which backend services are currently unavailable, which is an array of strings.
  // For example, if Hermes and WhatsApp are unavailable, we will setUnavailable(["Hermes", "WhatsApp"]) and later in the DashboardHeader component we will display a message to the user that these services are unavailable.
  // We use this state for example in the DashboardHeader component to display a message to the user that these services are unavailable.
  // This state is important because one API might fail while the others are still working
  const [unavailable, setUnavailable] = useState<string[]>([]);

  // This is used to display the success or the error message to the user in the DashboardHeader component.
  // setNotice({ text: "Unable to communicate with Manager", kind: "error", });
  // Here, Notice is a TypeScript type describing the message: type Notice = { text: string; kind: "ok" | "error"; };
  const [notice, setNotice] = useState<Notice | null>(null);

  // This is used to store which section of the dashboard is currently active, which is a string.
  // For example, if the user is on the "Jobs" section, we will set activeSection("jobs").
  // Our sidebar contains navigation items such as Dashboard, Connections, Workspace, and Scheduler. When someone clicks Connections, we want the corresponding sidebar item to become highlighted.
  // It will be used in the Sidebar component to highlight the currently active section.
  // <Sidebar activeSection={activeSection} navigate={navigate} />
  const [activeSection, setActiveSection] = useState("dashboard");

  // This is used for controlling the create Job dialog in the SchedulerManager component
  // <SchedulerManager createJobOpen={creatingJob} openCreateJob={() => setCreatingJob(true)} closeCreateJob={() => setCreatingJob(false)} />
  // we are passing the state and the functions to open and close the dialog to the SchedulerManager component so that we later can use them to open and close the dialog when the user clicks on the create job button or closes the dialog.
  const [creatingJob, setCreatingJob] = useState(false);

  // These are used for controlling the edit profile and upload CV dialogs in the WorkspaceManager component
  // <WorkspaceManager editProfileOpen={editingProfile} closeEditProfile={() => setEditingProfile(false)} uploadCvOpen={uploadingCv} closeUploadCv={() => setUploadingCv(false)} />
  // we are passing the state and the functions to open and close the dialogs to the WorkspaceManager component so that we later can use them to open and close the dialogs when the user clicks on the edit profile or upload CV buttons or closes the dialogs.
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);

  // This is used to store whether a job is currently running or not
  // for example the user might click on "Trigger Job" The backend could take a while to process the request and we don't want the user to click on "Trigger Job" again while the job is still running.
  // we use this approach to prevent accedently requeting several executions
  //   So, when the operation begins: setRunningJob(true);
  // When the operation finishes: setRunningJob(false);
  // and it is used in <QuickActions busy={runningJob} onTriggerJob={handleTriggerSelectedJob} />
  // The component can disable the button while the request is being processed
  const [runningJob, setRunningJob] = useState(false);

  // Below we have a useCallback function to understand it, we need first to understand what will happen in case we don't use the useCallback
  // Without the useCallback, the method will look like this:
  // const refresh = async () => {
  // setRefreshing(true);
  // Fetch backend information...
  // setRefreshing(false);
  // };

  // This will be totally valid but later when the component re-renders, the refresh function will be recreated and JavaScript will consider it a new function and creates a new refresh function object each time
  // for example if the manager is:
  // function DashboardManager() {
  //   const [count, setCount] = useState(0);
  //   const refresh = () => {
  //     console.log("Refreshing");
  //   };
  //   // ... }

  // When the setCount(1) is called, we know that the component will re-render and the refresh function will be recreated again
  // notice that the refresh function is stil preforming the same functionality but it's refrence ID is changed

  // Now what useCallback adds and changes?
  // It keeps the same function reference between renders ==> if any of the useState defined above or below changes React can reuse the existing function reference
  // The [] at the end is called the dependency array
  // 1- [] The function refrence stays stable after it initial creation
  // 2- [userId] — React gives us a new function reference when userId changes.

  // Now, the most important part which is why do we need it in our project?
  // First we need to understand what we are trying to achieve:
  // 1- Immediately: Fetch the latest Hermes, Codex, WhatsApp, and Scheduler statuses.
  // 2- Automatically: Fetch those statuses again every 60 seconds, without refreshing the browser.
  // For example, if Hermes disconnects while the dashboard is open, we want the UI to eventually reflect that change.
  // That's why we use useEffect together with setInterval.

  // First we need to understand what useEffect does by itself: for example if we have:
  // useEffect(() => {
  // console.log("The component mounted");
  // }, []);
  // () => { ... }: Function containing the work React should execute
  // []: Dependency array. React executes the function only when the component mounts and when any of the dependencies change. An empty array means "never re-run".

  // Second we need to understand the setInterval function: for example if we have:
  //   setInterval(() => {
  //   console.log("Hello");
  // }, 5000);

  // () => { console.log("Hello") } is the function to execute.
  // 5000 is the interval in milliseconds.

  // How do we stop the interval?
  // setInterval returns an identifier. We store it inside interval so we can later stop the timer: clearInterval(interval);

  // Now lets combine useEffect and setInterval, to understand that we are going to use a simplified example:
  //   useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log("Checking the server...");
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  // When first the component mounts, the useEffect function executes and creates the interval
  // The interval then starts counting and every 5 seconds it prints the message, then keeps repeating
  // we have the cleanup function that is returned from the useEffect and react calls the cleanup function when the component unmounts or before an effect re-runs because its dependencies changed. ==> So cleanup prevents unnecessary background work and duplicate intervals.

  // Now, lets talk about the actual refresh function that we are using in our project
  // What the function below does, is that every time we call refresh(); It sends API requests to retrieve the latest information

  const refresh = useCallback(async () => {
    // We set refreshing to true so that the UI can display a loading indicator while we fetch the latest information from the backend.
    setRefreshing(true);

    try {
      // Why not call them one by one?
      // For example, if each request takes one second, the total could be roughly four seconds.
      // With Promise.allSettled, they can run concurrently, so the total could be closer to the slowest request.

      // Why Promise.allSettled instead of Promise.all?
      // Imagine: Hermes: Success, Codex: Success, WhatsApp: Failed,  Scheduler: Success
      // Promise.all rejects when one of the requests rejects, so we wouldn't receive a normal combined success result.
      // Promise.allSettled gives us the outcome of each request individually, regardless of failures.
      // This is useful because a WhatsApp failure should not prevent Hermes status or scheduler jobs from appearing.

      const results = await Promise.allSettled([
        // Each function calls a frontend service, which sends an HTTP request to our backend.
        getHermesStatus(),
        getCodexStatus(),
        getWhatsAppStatus(),
        getSchedulerJobs(),
      ] as const);

      setUnavailable(
        // flatMap() goes through every item in an array and combines the arrays returned by the callback into one array.
        results.flatMap((result, index) =>
          result.status === "rejected"
            ? [["Hermes", "Codex", "WhatsApp", "Scheduler"][index]]
            : [],
        ),
      );
      setHermes(results[0].status === "fulfilled" ? results[0].value : null);
      setCodex(results[1].status === "fulfilled" ? results[1].value : null);
      setWhatsApp(results[2].status === "fulfilled" ? results[2].value : null);
      // we pass these states to components such as: <StatusOverview hermes={hermes} codex={codex} whatsapp={whatsapp} />

      // updating the sceduker jobs
      // Did the scheduler request succeed? & Did it return an array?
      if (
        results[3].status === "fulfilled" &&
        Array.isArray(results[3].value)
      ) {
        const latestJobs = results[3].value;

        // We save the list of jobs returned by the backend.
        setJobs(latestJobs);

        // latestJobs.some(job => job.id === previous) checks if the previously selected job still exists in the latest list of jobs.
        setSelectedJobId((previous) =>
          previous && latestJobs.some((job) => job.id === previous)
            ? previous
            : (latestJobs[0]?.id ?? ""),
        );
      } else {
        setJobs([]);
        setSelectedJobId("");
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setUnavailable(["Dashboard"]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Now we need to understand the useEffect that we are using below
  // We are telling react to execute the following fallback function when the component first renders and rerun if it dependecies change
  useEffect(() => {
    // This calls refresh() immediately when the effect runs.
    // The void operator is used to indicate that we don't wait for the promise to resolve.
    void refresh();

    // Every approximately 60 seconds, the timer calls refresh() again.
    const interval = setInterval(() => void refresh(), 60_000);

    // This tells React how to clean up the interval when the effect needs to stop.
    return () => clearInterval(interval);

    // It tells React that the effect depends on the refresh function. If the reference to refresh changes, React will clean up the old effect and set it up again.
  }, [refresh]);

  // Now the important distiction here is that why are we using useCallback for refresh() and not using regular function declaration?
  // At first it seems like we can just define refresh() as a regular function and it will work the same way

  // we are going to study the consequese based on the above clarification of the useCallback
  // Component renders ==> new refresh function is created (not called) ==> useEffect runs and calls refresh() ==> API returns data and we update the states (useStates) inside the refresh() logic ==> React re-renders since state changed (Another refresh function is created) ==> Dependency changes and useEffect runs again
  // using the useCallback preserves the same refresh function reference across renders as long as its dependencies haven't changed.

  // So, now React renders the component, creates a refresh function, useEffect calls the refresh function, API returns data and we update the states (useStates) inside the refresh() logic, React re-renders since state changed but the refresh function reference is still the same so useEffect doesn't restart because of the re-renders.
  // In general the importance of the useCallback is to prevent the unecessary re-execution of the useEffect when the component re-renders due to another state changes (whatever the state is) since useCallback preserves the same function reference across those re-renders as long as it's dependencies haven't changed

  // Also there is another important reason, if we defined the refresh function inside the useEffect, it won't be possible to call it from other component

  // This is the wrapper function that we use to display a notification message to the user in the DashboardHeader component.
  // It takes two parameters: text and kind that make up the object Notice: { text, kind } and calls the setter of the notice state.
  function notify(text: string, kind: "ok" | "error") {
    setNotice({ text, kind });
  }

  // This function is used to navigate to a specific section of the dashboard when the user clicks on a sidebar item.
  // for example, if the user clicks on "Scheduler" in the sidebar, the dashboard should highlight the item and scroll to the Scheduler section.
  // This function takes as a parameter the id of the section to navigate to, this id parameter identifies which section the user wants to view
  // The function does two things:
  // 1- It updates the activeSection state to the id of the section to navigate to, so that the sidebar can highlight the correct item.
  // 2- It uses document.getElementById(id)?.scrollIntoView() to scroll the page to the section with the given id, so that the user can see the section they want to view.
  function navigate(id: string) {
    setActiveSection(id);

    // document represents the browser's DOM (Document Object Model) and provides methods to interact with it.
    // getElementById(id) searches the DOM for an element with the specified id and returns it if found, or null if not found.
    // The optional chaining operator (?.) is used to safely call scrollIntoView() only if the element exists (not null).
    // scrollIntoView({ behavior: "smooth", block: "start" }) scrolls the page to bring the element into view, with a smooth scrolling animation and aligning it to the top of the viewport.
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    // The above code is equivalent to:
    // const element = document.getElementById(id);
    // if (element) {
    //   element.scrollIntoView({ behavior: "smooth", block: "start" });
    // }
  }

  // Now we need to understand the importance of the handleTriggerSelectedJob function.
  // Assume we have the following set of Jobs: [{ id: "job1", name: "Job 1" }, { id: "job2", name: "Job 2" }, { id: "job3", name: "Job 3" }]
  // And we select "job2" in the SchedulerManager component
  // then we click Trigger Job in the QuickActions component, the handleTriggerSelectedJob function will be called and it will send a request to the backend to Hermes to execute that selected job and this function coordinates the process.
  async function handleTriggerSelectedJob() {
    // if there is no selected job then we can't know which job to trigger
    // or
    // if the job is already running, we don't want to trigger it again. The runningJob state is already explained above and its role is to prevent the user from triggering the multiple jobs or the same job multiple times.
    if (!selectedJobId || runningJob) return;

    // if the above condition is passed we need to set the runningJob state to true so that the UI can display a loading indicator while we send the request to the backend to trigger the selected job.
    // and at the same time we need are trying to make safe execution incase the user clicks Trigger Job again
    // Also this state is passed to the QuickActions component so that it can disable the Trigger Job button while the request is being processed.
    // <QuickActions busy={runningJob} onTriggerJob={handleTriggerSelectedJob} />
    setRunningJob(true);

    //
    try {
      // This is the main logic which is responsible for sending the request to the backend to trigger the selected job.
      // This function is imported from the scheduler-service.ts file which is responsible for sending the request to the backend to trigger the selected job.
      // import { runSchedulerJob } from "@/lib/admin-services/scheduler-service";
      // Then the service sends the request to the Next.js backend API route.
      // QuickActions — Trigger Job button ==> handleTriggerSelectedJob() ==> runSchedulerJob(jobId, "trigger") ==> POST /api/v1/scheduler/jobstrigger ==> Next.js Backend → Hermes

      // Notice the await. JavaScript waits for this service call to settle before continuing to the next statement in the try block.
      await runSchedulerJob(selectedJobId, "trigger");

      // Why to call refresh() after triggering the job?
      // Because the job status might change after triggering it, it might lead to a change in its status or last-run informaiton
      // We want to request updated data from the backend so the dashboard displays the latest available information.
      await refresh();

      // Since we previously clarified that the notice state is used to display a success or error message to the user in the DashboardHeader component, we can use the notify() function which is the wrapper function that we use to display a notification message to the user in the DashboardHeader component.
      notify(
        "Hermes handled the run request. Check job history and WhatsApp for the outcome.",
        "ok",
      );
    } catch (error) {
      // Suppose the backend return an error, for exmaple due to Hermes unavailablity
      // The service might throw an error
      // Then JavaScript will jump to the catch block and we can use the notify() function to display an error message to the user in the DashboardHeader
      notify(
        error instanceof Error ? error.message : "Unable to run job",
        "error",
      );
    } finally {
      // This executes whether the operation succeeds or fails.
      // Its purpose is to reset runningJob to false, allowing the button to be used again.
      // Without this cleanup, the button could remain disabled after an error.
      setRunningJob(false);
    }
  }

  // we already above defined hermes as a state variable that stores the current Hermes status, which is either a HermesStatus object or null.
  // First when the component mounts, hermes is null, until the useEffect runs and calls refresh() to fetch the Hermes status from the backend.
  // For example: { version: "1.0", gateway_running: true, gateway_state: "running", overall: "ok", active_sessions: 2 }
  // Then the below line calculates whether Hermes is healthy based on the retrieved status. It checks if hermes is not null, if the gateway is running, and if the overall status is "ok"
  // if the above conditions are met, gatewayHealthy will be true, otherwise it will be false.

  // Note: hermes?.gateway_running === true uses optional chaining (?.) to safely access the gateway_running property of hermes even when hermes is null.
  // This calculated value is used in the DashboardHeader component to display a visual indicator of Hermes' health status.
  const gatewayHealthy =
    hermes?.gateway_running === true && hermes.overall === "ok";

  return (
    <div className="neon-app" id="dashboard">
      {/* Sidebar:
      - First this DashboardManager is initialized and the sidebar is rendered ==> DashboardManager will serve as the parent component
      - The sidebar will display the available sections and allow navigation between them and highlightes the currently active section. 
      - These props are passed to the sidebar as one object so we are sending obeject that have the values for each prop. note that {} that wraps each value are for the sake of passing the value and not like passing hermes in object format. 
      - hermes={hermes}: The left hermes is the prop name. The right hermes is the state variable in DashboardManager.
      - activeSection={activeSection}: The left activeSection is the prop name. The right activeSection is the state variable in DashboardManager.
      - navigate={navigate}: The left navigate is the prop name. The right navigate is the function in DashboardManager.
      */}
      <Sidebar
        hermes={hermes}
        activeSection={activeSection}
        navigate={navigate}
      />
      <main className="neon-main">
        {/* DashboardHeader: This component is responsible for displaying the top section of our dashboard including:
         * - Application title and description.
         * - Hermes health indicator.
         * - Refresh button.
         * - Success/error notifications and unavailable-service warnings.
         *
         * These below are the props that are going to be passed to the DashboardHeader component:
         * - gatewayHealthy: A boolean indicating the health of the Hermes gateway.
         * - refreshing: A boolean indicating whether the dashboard is currently refreshing.
         * - refresh: A function to trigger a refresh of the dashboard.
         * - notice: A notice message to display any important information.
         * - setNotice: A function to update the notice message ==> allow the child component to dismiss a notice message by calling setNotice(null).
         * - unavailable: string[]	Names of services that failed to load
         *
         * Notice that we're passing both data and functions, exactly as we did in Sidebar.
         */}
        <DashboardHeader
          gatewayHealthy={gatewayHealthy}
          refreshing={refreshing}
          refresh={refresh}
          notice={notice}
          setNotice={setNotice}
          unavailable={unavailable}
        />

        {/* Status Overview: This component displays the status of various services in a grid layout.
         * - It receives the status of each service as props and displays it using the HealthCard component.
         * - The props passed to StatusOverview are:
         *   - hermes: The status of the Hermes service.
         *   - whatsapp: The status of the WhatsApp service.
         *   - codex: The status of the Codex service.
         *   - jobs: The list of scheduled jobs.
         *   - loading: A boolean indicating whether the data is loading.
         *  - gatewayHealthy: A boolean indicating the health of the Hermes gateway.
         */}
        <StatusOverview
          hermes={hermes}
          whatsapp={whatsapp}
          codex={codex}
          jobs={jobs}
          loading={loading}
          gatewayHealthy={gatewayHealthy}
        />
        <div className="neon-content-grid">
          {/* Connections: This component is responsible for managing the connections to various services.
           * - It allows users to connect to different services and manage their connections such as Codex, and WhatsApp.
           * - It recives information from this component DashboardManager and it also forwards some of the information to its child components such as ConnectionsPanel
           *
           *  The props passed are:
           * - hermes: The status of the Hermes service.
           * - codex: The status of the Codex service.
           * - whatsapp: The status of the WhatsApp service.
           * - refreshing: A boolean indicating whether the dashboard is currently refreshing.
           * - refresh: A function to trigger a refresh of the dashboard.
           * - navigate: A function to navigate to a specific page.
           * - notify: A function to display a notification.
           *
           */}
          <ConnectionsManager
            hermes={hermes}
            codex={codex}
            whatsapp={whatsapp}
            refreshing={refreshing}
            refresh={refresh}
            navigate={navigate}
            notify={notify}
          />
          {/* Workspace: This component is responsible for managing the workspace, including enabling users to edit their profile, the agents.md file, and upload their CV.
           * - It receives information from this component DashboardManager and it also forwards some of the information to its child components.
           * - The props passed are:
           * - editProfileOpen: This is used to tell WorkspaceManger when to open the edit profile dialog.
           * - we are passing the state from DashboardManager to WorkspaceManger so that it can use it to open the edit profile dialog when the user clicks on the edit profile button in QuickActions component.
           *
           * - closeEditProfile: This is used to Allow the WorkspaceManger to close the edit profile dialog.
           *
           * - uploadingCvOpen: This is used to tell WorkspaceManger when to open the upload CV dialog.
           * - we are passing the state from DashboardManager to WorkspaceManger so that it can use it to open the upload CV dialog when the user clicks on the upload CV button in QuickActions component.
           *
           * - closeUploadCv: This is used to Allow the WorkspaceManger to close the upload CV dialog.
           *
           * - notify: This is used to Allow the WorkspaceManger to display a notification message to the user in the DashboardHeader component.
           */}
          <WorkspaceManager
            editProfileOpen={editingProfile}
            closeEditProfile={() => setEditingProfile(false)}
            uploadCvOpen={uploadingCv}
            closeUploadCv={() => setUploadingCv(false)}
            notify={notify}
          />
          {/* SchedulerManager manages the scheduled jobs that Hermes uses to execute automated tasks, such as searching for jobs at a specified frequency.
           * 1- Its main responsibilities include displaying the list of scheduled jobs along side their details
           * - It receives information from this component DashboardManager using the jobs state which is passed as props, and it also forwards some of the information to its child components.
           *
           * 2- It allows users to create new jobs, edit existing jobs, and delete jobs.
           * 3- It allow users to trigger a job manually, which is useful for testing or immediate execution.
           * 5- It allow user to select a job from the list of jobs, and the selected job is highlighted in the UI and can be triggered using the QuickActions component.
           * 6- It allow users to Pause and Resume jobs, which is useful for temporarily stopping a job without deleting it.
           * 8- It allow user to delete a job, which removes it from the list of scheduled jobs and prevents it from running in the future.
           *
           * - The props passed to SchedulerManager are:
           * - jobs: The list of scheduled jobs.
           * - loading: A boolean indicating whether the data is loading -- this is used to show a loading indicator while the data is being fetched when the component is initialized or when we click refresh.
           * - selectedJobId: The id of the currently selected job.
           * - onSelectJob: A function to update the selected job id when a user selects a job from the list.
           * - refresh: A function to trigger a refresh of the dashboard, which is used to update the list of jobs after creating, editing, or deleting a job.
           * - notify: A function to display a notification message to the user in the DashboardHeader component.
           * - createJobOpen: A boolean indicating whether the create job dialog is open.
           * - openCreateJob: A function to open the create job dialog.
           * - closeCreateJob: A function to close the create job dialog.
           */}
          <SchedulerManager
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            refresh={refresh}
            notify={notify}
            createJobOpen={creatingJob}
            openCreateJob={() => setCreatingJob(true)}
            closeCreateJob={() => setCreatingJob(false)}
          />
          <ActivityPanel
            jobs={jobs}
            refreshing={refreshing}
            refresh={refresh}
          />
          <QuickActions
            selectedJobId={selectedJobId}
            busy={runningJob}
            onTriggerJob={handleTriggerSelectedJob}
            onCreateJob={() => setCreatingJob(true)}
            onUploadCv={() => setUploadingCv(true)}
            onEditProfile={() => setEditingProfile(true)}
          />
        </div>
        <footer className="neon-footer">
          <span>Job Search Agent · Private localhost dashboard</span>
          <span>Live status and scheduled job data from your Hermes APIs</span>
        </footer>
      </main>
    </div>
  );
}
