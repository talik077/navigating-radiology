import {
  getCaseData,
  getCourseData,
  getAdjacentCases,
  toStudySummary,
} from "@/lib/db/queries";
import { notFound } from "next/navigation";
import CaseContent from "./CaseContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string; caseId: string }>;
}) {
  const { courseSlug, caseId } = await params;
  const c = await getCaseData(courseSlug, caseId);
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
  const [course, caseData] = await Promise.all([
    getCourseData(courseSlug),
    getCaseData(courseSlug, caseId),
  ]);
  if (!caseData || !course) notFound();

  const { prev, next } = await getAdjacentCases(courseSlug, caseId);
  const studySummary = toStudySummary(caseData);
  const caseIndex = course.cases.findIndex((c) => c.caseId === caseId);

  return (
    <CaseContent
      course={{ courseName: course.courseName, totalCases: course.cases.length }}
      caseData={caseData}
      studySummary={studySummary}
      courseType={courseType}
      courseSlug={courseSlug}
      caseId={caseId}
      caseIndex={caseIndex}
      prev={prev ? { caseId: prev.caseId, caseNumber: prev.caseNumber } : null}
      next={next ? { caseId: next.caseId, caseNumber: next.caseNumber } : null}
    />
  );
}
