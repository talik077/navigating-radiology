"use client";

import { useState } from "react";

export default function AccordionSection({
  name,
  html,
  defaultOpen = false,
}: {
  name: string;
  html: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left font-semibold transition-colors hover:bg-surface-hover"
      >
        <span className="text-sm">{name}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="accordion-content" data-open={open}>
        <div className="accordion-inner">
          <div
            className="teaching-content border-t border-border px-5 py-4 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
