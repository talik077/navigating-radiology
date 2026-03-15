"use client";

import { useState } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import type { TeachingSection } from "@/lib/types";

export default function DiagnosisPanel({
  videoUrl,
  teachingSections,
}: {
  videoUrl?: string;
  teachingSections: TeachingSection[];
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(["0"]));
  const allKeys = new Set(teachingSections.map((_, i) => String(i)));
  const allExpanded = selectedKeys.size === teachingSections.length;

  const toggleAll = () => {
    setSelectedKeys(allExpanded ? new Set<string>() : allKeys);
  };

  return (
    <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-default-200 bg-content1">
      {/* Video embed */}
      {videoUrl ? (
        <div className="border-b border-default-200">
          <iframe
            src={videoUrl}
            className="aspect-video w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center border-b border-default-200 bg-content2/50 py-8">
          <div className="flex flex-col items-center gap-2 text-default-400">
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
            <Button
              size="sm"
              variant="light"
              color="primary"
              onPress={toggleAll}
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        )}
        <Accordion
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
          variant="bordered"
          className="gap-3"
          itemClasses={{
            base: "py-0",
            title: "text-sm font-semibold",
            content: "pt-0 pb-4",
            trigger: "py-3",
          }}
        >
          {teachingSections.map((section, i) => (
            <AccordionItem key={String(i)} title={section.name}>
              <div
                className="teaching-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
