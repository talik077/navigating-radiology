import Link from "next/link";
import { getCaseData, getCourseData, getAdjacentCases, getAllCaseParams, toStudySummary } from "@/lib/data";
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
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <Link href={`${basePath}/${caseId}`} className="text-sm text-muted hover:text-accent">
          &larr; Back to Case
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">{caseData.diagnosisTitle}</h1>

      <div className="mb-6 overflow-hidden rounded-lg border border-border bg-black" style={{ height: "60vh" }}>
        <DicomViewer study={studySummary} courseSlug={courseSlug} caseId={caseId} />
      </div>

      {caseData.videoUrl && (
        <div className="mb-6 overflow-hidden rounded-lg border border-border">
          <iframe
            src={caseData.videoUrl}
            className="aspect-video w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      )}

      <div className="space-y-4">
        {caseData.teachingSections.map((section, i) => (
          <AccordionSection key={i} name={section.name} html={section.html} defaultOpen={i === 0} />
        ))}
      </div>

      {next && (
        <div className="mt-8 text-center">
          <Link
            href={`${basePath}/${next.caseId}`}
            className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-black transition-colors hover:bg-accent-hover"
          >
            Next Case: {next.caseNumber} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
