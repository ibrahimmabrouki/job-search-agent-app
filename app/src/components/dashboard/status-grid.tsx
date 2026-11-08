import { Bot, CalendarClock, MessageCircleMore, Sparkles } from "lucide-react";
import { statusItems } from "@/lib/mock-data";
import { StatusPill } from "@/components/ui/status-pill";

const icons = {
  hermes: Bot,
  codex: Sparkles,
  whatsapp: MessageCircleMore,
  scheduler: CalendarClock,
};

export function StatusGrid() {
  return (
    <section className="status-section">
      <div className="section-heading compact-heading">
        <div>
          <h2>System status</h2>
          <p>Everything needed for automated job search, at a glance.</p>
        </div>
      </div>
      <div className="status-grid">
        {statusItems.map((item) => {
          const Icon = icons[item.id as keyof typeof icons];
          return (
            <div className="status-card" key={item.id}>
              <div className="status-icon"><Icon size={22} /></div>
              <div className="status-copy">
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </div>
              <StatusPill state={item.state} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
