import { FilePenLine, FileText, Upload } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { agentFiles } from "@/lib/mock-data";

export function ConfigSection() {
  return (
    <SectionCard title="Agent configuration" description="The files that define who the agent searches for and how it behaves.">
      <div className="file-list">
        {agentFiles.map((file) => (
          <div className="file-row" key={file.name}>
            <div className={`file-icon ${file.kind === "pdf" ? "pdf" : ""}`}><FileText size={20} /></div>
            <div className="file-copy"><strong>{file.name}</strong><span>{file.description}</span></div>
            <button className="btn btn-outline" type="button">
              {file.action === "Replace" ? <Upload size={15} /> : <FilePenLine size={15} />}
              {file.action}
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
