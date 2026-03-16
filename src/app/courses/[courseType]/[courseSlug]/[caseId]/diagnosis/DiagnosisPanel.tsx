"use client";

import { useState, useCallback, useMemo } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import DOMPurify from "isomorphic-dompurify";
import type { TeachingSection } from "@/lib/types";
import { useViewer } from "@/components/viewer/ViewerContext";

export default function DiagnosisPanel({
  diagnosisVideoUrl,
  teachingSections,
}: {
  diagnosisVideoUrl?: string;
  teachingSections: TeachingSection[];
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(["0"]));
  const allKeys = new Set(teachingSections.map((_, i) => String(i)));
  const allExpanded = selectedKeys.size === teachingSections.length;
  const viewerCtx = useViewer();

  const sanitizedSections = useMemo(
    () =>
      teachingSections.map((s) => ({
        ...s,
        html: DOMPurify.sanitize(s.html, {
          ADD_TAGS: ["iframe"],
          ADD_ATTR: ["allowfullscreen", "frameborder", "target"],
        }),
      })),
    [teachingSections]
  );

  const toggleAll = () => {
    setSelectedKeys(allExpanded ? new Set<string>() : allKeys);
  };

  // Intercept clicks on teaching links (auto-scroll links with ?s=&i=&ww=&wc=&an= params)
  const handleTeachingClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("?")) return;

      e.preventDefault();

      const params = new URLSearchParams(href.slice(1));
      const s = params.get("s");
      const i = params.get("i");
      const ww = params.get("ww");
      const wc = params.get("wc");
      const an = params.get("an");

      if (s == null || i == null || ww == null || wc == null) return;

      viewerCtx?.navigateTo({
        seriesUID: s,
        instanceIndex: /^\d+$/.test(i) ? parseInt(i, 10) : i,
        ww: parseInt(ww, 10),
        wc: parseInt(wc, 10),
        annotations: an === "true",
      });
    },
    [viewerCtx]
  );

  return (
    <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-default-200 bg-content1">
      {/* Video embed */}
      {diagnosisVideoUrl ? (
        <div className="border-b border-default-200">
          <iframe
            src={diagnosisVideoUrl}
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
          {sanitizedSections.map((section, i) => (
            <AccordionItem key={String(i)} title={section.name}>
              <div
                className="teaching-content text-sm leading-relaxed"
                onClick={handleTeachingClick}
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
