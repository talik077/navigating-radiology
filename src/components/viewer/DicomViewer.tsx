"use client";

import dynamic from "next/dynamic";
import type { StudySummary } from "@/lib/types";

const CornerstoneViewer = dynamic(
  () => import("./CornerstoneViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-muted">Loading viewer...</span>
        </div>
      </div>
    ),
  }
);

interface Props {
  study: StudySummary;
  courseSlug: string;
  caseId: string;
}

export default function DicomViewer({ study, courseSlug, caseId }: Props) {
  return <CornerstoneViewer study={study} courseSlug={courseSlug} caseId={caseId} />;
}
