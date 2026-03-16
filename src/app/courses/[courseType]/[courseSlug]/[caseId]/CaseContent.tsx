"use client";

import { Button, Chip, Divider, Link as HeroLink } from "@heroui/react";
import NextLink from "next/link";
import { useState, useEffect, useRef } from "react";
import { List, Play, ChevronUp } from "lucide-react";
import DicomViewer from "@/components/viewer/DicomViewer";
import type { CaseData, StudySummary } from "@/lib/types";

interface Props {
  course: { courseName: string; totalCases: number };
  caseData: CaseData;
  studySummary: StudySummary;
  courseType: string;
  courseSlug: string;
  caseId: string;
  caseIndex: number;
  prev: { caseId: string; caseNumber: number } | null;
  next: { caseId: string; caseNumber: number } | null;
}

const difficultyColor: Record<string, "success" | "warning" | "danger"> = {
  "Bread & Butter": "success",
  Moderate: "warning",
  Challenging: "danger",
};

export default function CaseContent({
  course,
  caseData,
  studySummary,
  courseType,
  courseSlug,
  caseId,
  caseIndex,
  prev,
  next,
}: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const basePath = `/courses/${courseType}/${courseSlug}`;

  // Auto-collapse video when Vimeo finishes playing
  useEffect(() => {
    if (!videoOpen) return;

    const handleMessage = (e: MessageEvent) => {
      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (data?.event === "finish") {
        setVideoOpen(false);
      }
    };

    const onLoad = () => {
      videoRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "addEventListener", value: "finish" }),
        "*",
      );
    };

    const iframe = videoRef.current;
    iframe?.addEventListener("load", onLoad);
    window.addEventListener("message", handleMessage);

    return () => {
      iframe?.removeEventListener("load", onLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [videoOpen]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-default-200 bg-content1 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            as={NextLink}
            href={basePath}
            size="sm"
            variant="flat"
            startContent={<List size={16} />}
          >
            Cases
          </Button>
          <span className="text-lg font-bold">{course.courseName}</span>
          <Chip size="sm" variant="flat" color="default">
            {caseIndex + 1} / {course.totalCases}
          </Chip>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-default-200 px-4 py-3">
        <h2 className="text-lg font-semibold">
          Case {caseData.caseNumber} – {caseData.clinicalHistory || "N/A"}
        </h2>
        <Button
          as={NextLink}
          href={`${basePath}/${caseId}/diagnosis`}
          color="primary"
          size="sm"
        >
          View Answer →
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <div className="flex flex-1 flex-col bg-black max-md:min-h-[50vh]">
          {caseData.historyVideoUrl && (
            <div className="w-full flex-shrink-0 border-b border-default-200">
              {videoOpen ? (
                <>
                  <div className="relative">
                    <iframe
                      ref={videoRef}
                      src={`${caseData.historyVideoUrl}&autoplay=1&dnt=1&api=1`}
                      className="aspect-video w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <button
                    onClick={() => setVideoOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 bg-default-100 py-1 text-xs text-default-500 transition-colors hover:bg-default-200"
                  >
                    <ChevronUp size={12} />
                    Hide Video
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setVideoOpen(true)}
                  className="flex w-full items-center justify-center gap-2 bg-default-100 py-2 text-sm text-default-500 transition-colors hover:bg-default-200"
                >
                  <Play size={14} />
                  Watch Case Presentation
                </button>
              )}
            </div>
          )}
          <div className="flex-1">
            <DicomViewer study={studySummary} courseSlug={courseSlug} caseId={caseId} />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-default-200 bg-content1 p-6 max-md:w-full max-md:border-l-0 max-md:border-t">
          <h3 className="mb-4 text-lg font-semibold">Clinical History</h3>
          <p className="leading-relaxed">
            {caseData.clinicalHistory || "No clinical history provided."}
          </p>

          {caseData.difficulty && (
            <div className="mt-6 flex items-center gap-2">
              <span className="text-sm text-default-400">Difficulty:</span>
              <Chip
                size="sm"
                variant="flat"
                color={difficultyColor[caseData.difficulty] || "default"}
              >
                {caseData.difficulty}
              </Chip>
            </div>
          )}

          <Divider className="my-6" />

          <div className="space-y-2">
            {prev && (
              <HeroLink
                as={NextLink}
                href={`${basePath}/${prev.caseId}`}
                size="sm"
                className="block text-default-400 hover:text-primary"
              >
                ← Prev: Case {prev.caseNumber}
              </HeroLink>
            )}
            {next && (
              <HeroLink
                as={NextLink}
                href={`${basePath}/${next.caseId}`}
                size="sm"
                className="block text-default-400 hover:text-primary"
              >
                Next: Case {next.caseNumber} →
              </HeroLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
