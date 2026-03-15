import Link from "next/link";
import {
  getCaseData,
  getCourseData,
  getAdjacentCases,
  getAllCaseParams,
  toStudySummary,
} from "@/lib/data";
import { notFound } from "next/navigation";
import DicomViewer from "@/components/viewer/DicomViewer";
import AccordionSection from "@/components/teaching/AccordionSection";

export function generateStaticParams() {
  return getAllCaseParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string; caseId: string }>;
}) {
  const { courseSlug, caseId } = await params;
  const c = getCaseData(courseSlug, caseId);
  return {
    title: `${c?.diagnosisTitle || `Case ${caseId}`} - Diagnosis | Navigating Radiology`,
  };
}

export default async function DiagnosisPage({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string; caseId: string }>;
}) {
  const { courseType, courseSlug, caseId } = await params;
  const course = getCourseData(courseSlug);
  const caseData = getCaseData(courseSlug, caseId);
  if (!caseData || !course) notFound();

  const { next } = getAdjacentCases(courseSlug, caseId);
  const basePath = `/courses/${courseType}/${courseSlug}`;
  const studySummary = toStudySummary(caseData);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            href={basePath}
            className="flex items-center gap-1 rounded-md bg-surface-hover px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            &#9776; Cases
          </Link>
          <h1 className="text-lg font-bold">{course.courseName}</h1>
        </div>
      </div>

      {/* Case heading bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">{caseData.diagnosisTitle}</h2>
        {next && (
          <Link
            href={`${basePath}/${next.caseId}`}
            className="rounded-lg bg-warning px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-warning/80"
          >
            Next: Case {next.caseNumber}
          </Link>
        )}
      </div>

      {/* Main content: viewer left, teaching right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Viewer - takes ~70% */}
        <div className="flex-1 bg-black">
          <DicomViewer
            study={studySummary}
            courseSlug={courseSlug}
            caseId={caseId}
          />
        </div>

        {/* Right panel - teaching content */}
        <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-border bg-surface">
          {/* Video embed */}
          {caseData.videoUrl && (
            <div className="border-b border-border">
              <iframe
                src={caseData.videoUrl}
                className="aspect-video w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          )}

          {/* Teaching sections */}
          <div className="p-4">
            <div className="space-y-3">
              {caseData.teachingSections.map((section, i) => (
                <AccordionSection
                  key={i}
                  name={section.name}
                  html={section.html}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
