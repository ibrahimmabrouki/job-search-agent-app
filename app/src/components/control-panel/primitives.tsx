import type { ElementType, ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

// This is the type that represents the structure of the data passed from any parent component to StatusDot component.
type StatusDotProps = {
  active?: boolean;
  warning?: boolean;
};
// This the reusable component that accepts two optional boolean props
// Online: active = true
// Warning: active = false, warning = true
// Offline: Both false
export function StatusDot({
  // both values are optional above but in case one of them is not provided we set default values to false
  active = false,
  warning = false,
}: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={`neon-dot ${active ? "online" : warning ? "warning" : "offline"}`}
    />
  );
}

export function StatusPill({
  active,
  warning,
  children,
}: {
  active?: boolean;
  warning?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`neon-pill ${active ? "positive" : warning ? "warn" : "muted"}`}
    >
      <StatusDot active={active} warning={warning} />
      {children}
    </span>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="neon-section-heading">
      <div className="neon-section-title-wrap">
        <Icon className="neon-section-icon" size={23} strokeWidth={1.85} />
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children ? <div className="neon-section-tools">{children}</div> : null}
    </div>
  );
}

export function HealthCard({
  icon: Icon,
  label,
  detail,
  active,
  warning,
}: {
  icon: ElementType;
  label: string;
  detail: string;
  active: boolean;
  warning?: boolean;
}) {
  return (
    <div className="neon-status-card">
      <Icon size={27} className="green" />
      <div>
        <strong>{label}</strong>
        <span>
          <StatusDot active={active} warning={warning} />
          {detail}
        </span>
      </div>
      <CheckCircle2
        size={25}
        className={active ? "status-check" : "status-muted-icon"}
        aria-hidden="true"
      />
    </div>
  );
}
