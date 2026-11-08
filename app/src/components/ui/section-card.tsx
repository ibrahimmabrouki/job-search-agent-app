import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, action, className = "" }: SectionCardProps) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
