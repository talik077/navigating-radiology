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
        className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold transition-colors hover:bg-surface-hover"
      >
        {name}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          className="teaching-content border-t border-border px-6 py-4 text-sm leading-relaxed text-muted"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
