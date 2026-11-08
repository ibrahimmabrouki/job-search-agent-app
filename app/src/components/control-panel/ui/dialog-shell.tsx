"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function DialogShell({ label, title, help, close, children, narrow = false }: {
  label: string;
  title: string;
  help: string;
  close: () => void;
  children: ReactNode;
  narrow?: boolean;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return <div className="neon-modal-backdrop" role="presentation"
    onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={`neon-modal ${narrow ? "narrow" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="neon-modal-title"><div><h2>{title}</h2><p>{help}</p></div>
        <button type="button" className="neon-icon-btn" aria-label="Close" onClick={close}><X size={20}/></button>
      </div>
      {children}
    </div>
  </div>;
}