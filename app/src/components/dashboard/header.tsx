import { BriefcaseBusiness, Circle } from "lucide-react";

export function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><BriefcaseBusiness size={21} strokeWidth={2.2} /></div>
        <div>
          <div className="brand-title">Job Search Agent</div>
          <div className="brand-subtitle">Local control panel</div>
        </div>
      </div>
      <div className="local-badge">
        <Circle size={9} fill="currentColor" />
        <div>
          <strong>Local only</strong>
          <span>No account required</span>
        </div>
      </div>
    </header>
  );
}
