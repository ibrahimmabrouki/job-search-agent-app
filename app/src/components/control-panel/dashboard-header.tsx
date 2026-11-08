"use client";

// Icons used in the DashboardHeader component.
import { CircleAlert, HardDrive, RefreshCw, X } from "lucide-react";

// TypeScript type describing a success or error notification.
import type { Notice } from "@/types/control-panel/control-panel.types";

// Reusable component that displays a status indicator.
import { StatusDot } from "./primitives";

/*
 * DASHBOARD HEADER PROPS
 *
 * DashboardManager is the parent component while DashboardHeader is the child component.
 *
 * The parent passes the following props:
 *
 * - gatewayHealthy: Indicates whether the Hermes gateway is healthy.
 * - refreshing: Indicates whether the dashboard is refreshing its data.
 * - refresh: Callback function that refreshes the dashboard data.
 * - notice: Success/error notification to display.
 * - setNotice: Function used to update or dismiss the notification.
 * - unavailable: Array containing the names of unavailable services.
 *
 * Data flows from the parent to the child through props.
 *
 * The child can call functions provided by the parent to request changes to the parent's state.
 */

type DashboardHeaderProps = {
  gatewayHealthy: boolean;
  refreshing: boolean;

  // Callback defined in DashboardManager.
  // It takes no arguments and returns a Promise<void> because it is an asynchronous function.
  refresh: () => Promise<void>;

  // Notice can contain a notification object or null. null means there is no notification to display.
  notice: Notice | null;

  // React state setter passed from DashboardManager.
  // Passing null removes the current notification.
  setNotice: (value: Notice | null) => void;

  // Example: ["Hermes", "WhatsApp"]
  unavailable: string[];
};

// Receive and destructure the props provided by DashboardManager.
export function DashboardHeader({
  gatewayHealthy,
  refreshing,
  refresh,
  notice,
  setNotice,
  unavailable,
}: DashboardHeaderProps) {
  return (
    // React Fragment groups multiple elements without adding an unnecessary HTML wrapper to the page.
    <>
      {/* Main dashboard header */}
      <header className="neon-topbar">
        {/* Application title and description */}
        <div className="neon-page-title">
          <h1>
            Job Search Agent <em>Control Panel</em>
          </h1>

          <p>
            Hermes-powered automation for job search, shortlisting, and
            notifications.
          </p>
        </div>

        {/* Header actions and status information */}
        <div className="neon-top-actions">
          {/*
           * HERMES STATUS INDICATOR
           *
           * StatusDot is another child component.
           *
           * gatewayHealthy is received from DashboardManager and passed to StatusDot through the active prop.
           *
           * DashboardManager → DashboardHeader → StatusDot
           */}
          <span className="neon-top-chip">
            <HardDrive size={17} />
            Local
            <StatusDot active={gatewayHealthy} />
          </span>

          {/*
           * REFRESH BUTTON
           *
           * refresh() is defined in DashboardManager and we received its reference through props.
           *
           * onClick={() => void refresh()}
           *
           * The arrow function waits for the user to click and when clicked, it executes the parent's refresh function.
           *
           * void indicates that we are intentionally not awaiting the returned Promise in this event handler.
           *
           * The parent refresh function:
           * 1. Sets refreshing to true.
           * 2. Requests updated data from the backend.
           * 3. Updates the relevant React states.
           * 4. Sets refreshing to false when finished.
           */}
          <button
            type="button"
            className="neon-icon-btn"
            onClick={() => void refresh()}
            aria-label="Refresh statuses"
            title="Refresh statuses"
          >
            {/*
             * CONDITIONAL CSS CLASS
             *
             * If refreshing is true:
             *   className = "neon-spin"
             *   The refresh icon displays a spinning animation.
             *
             * Otherwise:
             *   className = ""
             *   The icon remains stationary.
             */}
            <RefreshCw size={18} className={refreshing ? "neon-spin" : ""} />
          </button>

          {/* Static avatar representing the private control panel */}
          <div className="neon-avatar" title="Private control panel">
            JS
          </div>
        </div>
      </header>

      {/*
       * NOTIFICATION MESSAGE
       *
       * notice is passed from DashboardManager.
       *
       * Example:
       * {
       *   text: "WhatsApp connected successfully",
       *   kind: "ok"
       * }
       *
       * {notice && (...)} is conditional rendering.
       *
       * If notice contains an object, display the notification.
       * If notice is null, render nothing.
       *
       * notice.kind determines the CSS class:
       * - "ok"    → Success notification styling.
       * - "error" → Error notification styling.
       *
       * notice.text contains the message displayed to the user.
       */}
      {notice && (
        <div role="status" className={`neon-notice ${notice.kind}`}>
          <span>{notice.text}</span>

          {/*
           * DISMISS NOTIFICATION
           *
           * setNotice is the state setter received from DashboardManager.
           *
           * When the user clicks X:
           *   setNotice(null)
           *
           * The parent's notice state becomes null.
           * React re-renders the component.
           * Since notice is now null, the notification disappears.
           *
           * This is another example of a child component
           * calling a function provided by its parent.
           */}
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/*
       * UNAVAILABLE SERVICES WARNING
       *
       * unavailable is an array received from DashboardManager.
       *
       * Example:
       * ["Hermes", "WhatsApp"]
       *
       * unavailable.length > 0 checks whether the array contains at least one unavailable service.
       *
       * If the array is empty, no warning is displayed.
       *
       * join(", ") converts the array into a readable string:
       *
       * ["Hermes", "WhatsApp"]
       *          ↓
       * "Hermes, WhatsApp"
       *
       * This warning is separate from the notice notification.
       * It is generated based on failed status requests.
       */}
      {unavailable.length > 0 && (
        <div role="alert" className="neon-warning">
          <CircleAlert size={16} />
          Could not load: {unavailable.join(", ")}. Check the local backend and
          refresh.
        </div>
      )}
    </>
  );
}
