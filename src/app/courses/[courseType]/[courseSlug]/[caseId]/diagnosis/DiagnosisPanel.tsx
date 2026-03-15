"use client";

import { useState } from "react";
import AccordionSection from "@/components/teaching/AccordionSection";
import type { TeachingSection } from "@/lib/types";

export default function DiagnosisPanel({
  videoUrl,
  teachingSections,
}: {
  videoUrl?: string;
  teachingSections: TeachingSection[];
}) {
  const [allOpen, setAllOpen] = useState(false);
  const [key, setKey] = useState(0);

  const toggleAll = () => {
    setAllOpen(!allOpen);
    setKey((k) => k + 1); // force re-render to reset accordion state
  };

  return (
    <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-border bg-surface">
      {/* Video embed */}
      {videoUrl ? (
        <div className="border-b border-border">
          <iframe
            src={videoUrl}
            className="aspect-video w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center border-b border-border bg-background/50 py-8">
          <div className="flex flex-col items-center gap-2 text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className="text-xs">No video available</span>
          </div>
        </div>
      )}

      {/* Teaching sections */}
      <div className="p-4">
        {teachingSections.length > 1 && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={toggleAll}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              {allOpen ? "Collapse All" : "Expand All"}
            </button>
          </div>
        )}
        <div className="space-y-3" key={key}>
          {teachingSections.map((section, i) => (
            <AccordionSection
              key={i}
              name={section.name}
              html={section.html}
              defaultOpen={allOpen || i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
