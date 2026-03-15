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
    title: `${c?.diagnosisTitle || `Case ${caseId}`} | Navigating Radiology`,
  };
}

export default async function CaseHistoryPage({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string; caseId: string }>;
}) {
  const { courseType, courseSlug, caseId } = await params;
  const course = getCourseData(courseSlug);
  const caseData = getCaseData(courseSlug, caseId);
  if (!caseData || !course) notFound();

  const { prev, next } = getAdjacentCases(courseSlug, caseId);
  const basePath = `/courses/${courseType}/${courseSlug}`;
  const studySummary = toStudySummary(caseData);

  // Find case index for progress indicator
  const caseIndex = course.cases.findIndex((c) => c.caseId === caseId);
  const totalCases = course.cases.length;

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
          <span className="text-xs text-muted">
            Case {caseIndex + 1} of {totalCases}
          </span>
        </div>
      </div>

      {/* Case heading bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">
          Case {caseData.caseNumber} - Hx:{" "}
          {caseData.clinicalHistory || "N/A"}
        </h2>
        <Link
          href={`${basePath}/${caseId}/diagnosis`}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Next: Case {caseData.caseNumber} Answer
        </Link>
      </div>

      {/* Main content: viewer left, clinical history right */}
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        {/* Viewer */}
        <div className="flex-1 bg-black max-md:min-h-[50vh]">
          <DicomViewer
            study={studySummary}
            courseSlug={courseSlug}
            caseId={caseId}
          />
        </div>

        {/* Right panel - clinical history */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-border bg-surface p-6 max-md:w-full max-md:border-l-0 max-md:border-t">
          <h3 className="mb-4 text-lg font-semibold">Clinical History</h3>
          <p className="leading-relaxed text-foreground">
            {caseData.clinicalHistory || "No clinical history provided."}
          </p>

          {caseData.difficulty && (
            <div className="mt-6">
              <span className="text-sm text-muted">Difficulty: </span>
              <span
                className={`text-sm font-medium ${
                  caseData.difficulty === "Bread & Butter"
                    ? "text-success"
                    : caseData.difficulty === "Moderate"
                      ? "text-warning"
                      : "text-danger"
                }`}
              >
                {caseData.difficulty}
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 space-y-2 border-t border-border pt-4">
            {prev && (
              <Link
                href={`${basePath}/${prev.caseId}`}
                className="block text-sm text-muted hover:text-accent"
              >
                &larr; Prev: Case {prev.caseNumber}
              </Link>
            )}
            {next && (
              <Link
                href={`${basePath}/${next.caseId}`}
                className="block text-sm text-muted hover:text-accent"
              >
                Next: Case {next.caseNumber} &rarr;
              </Link>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="mt-6 text-xs text-muted/60">
            Scroll: navigate slices | Drag: window/level
          </div>
        </div>
      </div>
    </div>
  );
}
