import Link from "next/link";
import { getCaseData, getCourseData, getAdjacentCases, getAllCaseParams, toStudySummary } from "@/lib/data";
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href={basePath} className="text-sm text-muted hover:text-accent">
          &larr; {course.courseName}
        </Link>
        <Link
          href={`${basePath}/${caseId}/diagnosis`}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          View Diagnosis &rarr;
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-bold">
        Case {caseData.caseNumber}
        {caseData.difficulty && (
          <span className="ml-3 text-sm font-normal text-muted">{caseData.difficulty}</span>
        )}
      </h1>

      <div className="mb-6 overflow-hidden rounded-lg border border-border bg-black" style={{ height: "70vh" }}>
        <DicomViewer study={studySummary} courseSlug={courseSlug} caseId={caseId} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold">Clinical History</h2>
        <p className="leading-relaxed text-muted">
          {caseData.clinicalHistory || "No clinical history provided."}
        </p>
      </div>

      <div className="mt-6 flex justify-between">
        {prev ? (
          <Link href={`${basePath}/${prev.caseId}`} className="text-sm text-muted hover:text-accent">
            &larr; Case {prev.caseNumber}
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`${basePath}/${next.caseId}`} className="text-sm text-muted hover:text-accent">
            Case {next.caseNumber} &rarr;
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
