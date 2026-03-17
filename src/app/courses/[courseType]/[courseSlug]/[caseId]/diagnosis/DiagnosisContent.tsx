"use client";

import { Button, Checkbox } from "@heroui/react";
import NextLink from "next/link";
import { List } from "lucide-react";
import DicomViewer from "@/components/viewer/DicomViewer";
import DiagnosisPanel from "./DiagnosisPanel";
import { ViewerProvider } from "@/components/viewer/ViewerContext";
import type { CaseData, StudySummary } from "@/lib/types";
import { useProgress } from "@/lib/hooks/use-progress";

interface Props {
  courseName: string;
  caseData: CaseData;
  studySummary: StudySummary;
  courseType: string;
  courseSlug: string;
  caseId: string;
  next: { caseId: string; caseNumber: number } | null;
}

export default function DiagnosisContent({
  courseName,
  caseData,
  studySummary,
  courseType,
  courseSlug,
  caseId,
  next,
}: Props) {
  const basePath = `/courses/${courseType}/${courseSlug}`;
  const { progress, markCompleted } = useProgress(courseSlug);
  const isCompleted = progress[caseId]?.completed ?? false;

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
          <span className="text-lg font-bold">{courseName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-default-200 px-4 py-3">
        <h2 className="text-lg font-semibold">{caseData.diagnosisTitle}</h2>
        <div className="flex items-center gap-3">
          <Checkbox
            size="sm"
            color="success"
            isSelected={isCompleted}
            onValueChange={(checked) => markCompleted(caseId, checked)}
          >
            <span className="text-sm text-default-500">Completed</span>
          </Checkbox>
          {next && (
            <Button
              as={NextLink}
              href={`${basePath}/${next.caseId}`}
              color="primary"
              size="sm"
            >
              Next: Case {next.caseNumber}
            </Button>
          )}
        </div>
      </div>

      <ViewerProvider study={studySummary}>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 bg-black">
            <DicomViewer study={studySummary} courseSlug={courseSlug} caseId={caseId} />
          </div>
          <DiagnosisPanel
            diagnosisVideoUrl={caseData.diagnosisVideoUrl}
            teachingSections={caseData.teachingSections}
          />
        </div>
      </ViewerProvider>
    </div>
  );
}
