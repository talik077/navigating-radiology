import {
  getCaseData,
  getCourseData,
  getAdjacentCases,
  toStudySummary,
} from "@/lib/db/queries";
import { notFound } from "next/navigation";
import DiagnosisContent from "./DiagnosisContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string; caseId: string }>;
}) {
  const { courseSlug, caseId } = await params;
  const c = await getCaseData(courseSlug, caseId);
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
  const [course, caseData] = await Promise.all([
    getCourseData(courseSlug),
    getCaseData(courseSlug, caseId),
  ]);
  if (!caseData || !course) notFound();

  const { next } = await getAdjacentCases(courseSlug, caseId);
  const studySummary = toStudySummary(caseData);

  return (
    <DiagnosisContent
      courseName={course.courseName}
      caseData={caseData}
      studySummary={studySummary}
      courseType={courseType}
      courseSlug={courseSlug}
      caseId={caseId}
      next={next ? { caseId: next.caseId, caseNumber: next.caseNumber } : null}
    />
  );
}
