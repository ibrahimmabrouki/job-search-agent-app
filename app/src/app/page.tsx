// This is the main entry point for the Control Panel Dashboard page.
// So, When someone visits the root URL of the app, localhost:XXXX, this page.tsx is the first thing that runs.

import DashboardManager from "@/components/control-panel/dashboard-manager";

export default function Home() {
  return <DashboardManager />;
}
