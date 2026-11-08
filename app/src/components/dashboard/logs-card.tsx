import { TerminalSquare } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { recentLogs } from "@/lib/mock-data";

export function LogsCard() {
  return (
    <SectionCard title="Recent activity" description="A lightweight view of what the agent is doing." action={<button className="text-button" type="button">View all</button>}>
      <div className="log-box">
        {recentLogs.map((line, index) => (
          <div className="log-line" key={line}><TerminalSquare size={14} /><span className="log-time">{`0${index + 9}:2${index}`}</span><span>{line}</span></div>
        ))}
      </div>
    </SectionCard>
  );
}
