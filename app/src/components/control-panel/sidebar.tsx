"use client";

// Icons used throughout the Sidebar component.
// These are React components imported from the lucide-react library.
import {
  Activity,
  CalendarDays,
  Folder,
  HardDrive,
  LayoutDashboard,
  Link2,
  Settings2,
  Zap,
} from "lucide-react";

// Import the TypeScript type that describes the Hermes status object.
// 'import type' is used because HermesStatus is only needed for type checking.
import type { HermesStatus } from "@/types/control-panel/control-panel.types";

// An array of objects representing the navigation buttons.
// Each object defines:
// - id: Identifies the section and its corresponding HTML element.
// - label: Text displayed on the navigation button.
// - icon: React icon component displayed beside the label.
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scheduler", label: "Jobs & Scheduler", icon: CalendarDays },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "workspace", label: "Workspace", icon: Folder },
  { id: "activity", label: "Activity & Logs", icon: Activity },
  { id: "settings", label: "Quick Actions", icon: Settings2 },
];

/*
 * UNDERSTANDING PROPS AND CALLBACK FUNCTIONS
 *
 * DashboardManager is the parent component and Sidebar is the child component.
 *
 * The parent renders the child like this: <Sidebar hermes={hermes} activeSection={activeSection} navigate={navigate} />
 *
 * Props allow the parent to pass data and functions to its child.
 *
 * 1. hermes: The Hermes status object received from the backend.
 *
 * 2. activeSection: The currently selected navigation section and this state is owned and managed by DashboardManager.
 *
 * 3. navigate: A function defined inside DashboardManager.
 *
 *    By writing navigate={navigate}, we pass a REFERENCE to the function without executing it.
 *
 *    Sidebar can then call this function when the user clicks a navigation button. This is called a CALLBACK PROP.
 *
 *    The child does not directly modify the parent's state, instead, it calls the function provided by the parent.
 */

// Defines the types of props that Sidebar expects from its parent.
type SidebarProps = {
  // Hermes status can be null before the API responds or if it fails.
  hermes: HermesStatus | null;

  // The currently active navigation section, e.g. "dashboard".
  activeSection: string;

  // A callback function provided by DashboardManager.
  //
  // (id: string) => void means: The function receives one argument named id of type string and it does not return a meaningful value.
  // Example: navigate("scheduler")
  // The actual function implementation exists in DashboardManager.
  navigate: (id: string) => void;
};

// Sidebar receives a single props object from DashboardManager.
//
// We use object destructuring to extract: hermes, activeSection, and navigate.
//
// Without destructuring, we would access them using: props.hermes, props.activeSection, and props.navigate.
export function Sidebar({ hermes, activeSection, navigate }: SidebarProps) {
  return (
    // <aside> represents secondary content, such as a sidebar.
    <aside className="neon-sidebar" aria-label="Main navigation">
      {/* Sidebar branding and application title */}
      <div className="neon-sidebar-brand">
        <span className="neon-logo" aria-hidden="true">
          <span />
          <span />
        </span>

        <strong>Job Search Agent</strong>
        <span>Control Panel</span>
      </div>

      {/* Main navigation section */}
      <nav className="neon-nav" aria-label="Dashboard sections">
        {/*
          NAV_ITEMS.map() loops through the navigation array.
          For each object, it creates one navigation button.

          We destructure each object to extract:
          - id: Section identifier
          - label: Button text
          - icon: Icon component, renamed to Icon

          Example:
          { id: "scheduler", label: "Jobs & Scheduler", icon: CalendarDays }

          Produces a button with:
          - The CalendarDays icon
          - The text "Jobs & Scheduler"
          - A click handler that calls navigate("scheduler")
        */}
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            // React uses the key to identify items in a rendered list.
            key={id}
            // Prevents the button from submitting a form.
            type="button"
            // Adds the "active" CSS class when this section is selected. Otherwise, adds an empty string.
            className={`neon-nav-item ${activeSection === id ? "active" : ""}`}
            // Accessibility attribute indicating the current location.
            aria-current={activeSection === id ? "location" : undefined}
            // CALLBACK EXPLANATION:
            //
            // navigate is the function received from DashboardManager.
            //
            // The arrow function waits for the user to click.
            // Only then does it call navigate(id).
            //
            // Example: Clicking Scheduler calls navigate("scheduler").
            //
            // The parent function then:
            // 1. Updates activeSection using setActiveSection(id).
            // 2. Scrolls to the corresponding HTML section.
            //
            // We do NOT write onClick={navigate(id)}
            // because that would execute navigate during rendering.
            // So, onClick in this case is replaced with an arrow function that calls navigate(id) only when the button is clicked.
            onClick={() => navigate(id)}
          >
            {/* Render the icon component for the current item */}
            <Icon size={19} strokeWidth={1.8} />

            {/* Display the navigation item's label */}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom section displaying local workspace and Hermes info */}
      <div className="neon-sidebar-bottom">
        <div className="neon-sidebar-system">
          {/* Local workspace information */}
          <div className="neon-mini-system">
            <HardDrive size={21} />

            <div>
              <strong>Local workspace</strong>
              <span>Private localhost dashboard</span>
            </div>
          </div>

          {/* Hermes information */}
          <div className="neon-mini-system">
            <Zap size={23} />

            <div>
              <strong>Hermes</strong>

              {/*
                FALLBACK VALUE EXPLANATION:

                hermes is an object passed from DashboardManager.

                hermes?.version uses optional chaining (?) so that it safely accesses version even if hermes is null.

              */}
              <span>
                {hermes?.version ? `v${hermes.version}` : "Status unavailable"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
