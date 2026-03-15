import Link from "next/link";
import { getCourseData, getAllCourseSlugs } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllCourseSlugs().map(({ courseType, courseSlug }) => ({
    courseType,
    courseSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = getCourseData(courseSlug);
  return { title: `${course?.courseName || courseSlug} | Navigating Radiology` };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const colors: Record<string, string> = {
    "Bread & Butter": "bg-success/20 text-success",
    Moderate: "bg-warning/20 text-warning",
    Challenging: "bg-danger/20 text-danger",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[difficulty] || "bg-muted/20 text-muted"}`}>
      {difficulty}
    </span>
  );
}

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string }>;
}) {
  const { courseType, courseSlug } = await params;
  const course = getCourseData(courseSlug);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2">
        <Link
          href={`/courses/${courseType}`}
          className="text-sm text-muted hover:text-accent"
        >
          &larr; {courseType === "on-call-preparation" ? "On-Call Prep" : "MRI Based"}
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold">{course.courseName}</h1>
      <p className="mb-6 text-muted">{course.description}</p>

      <div className="mb-4 text-sm text-muted">
        {course.caseCount} cases
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">#</th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Clinical History
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                Difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {course.cases.map((c) => (
              <tr
                key={c.caseId}
                className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-3 font-mono text-muted">
                  {c.caseNumber}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/courses/${courseType}/${courseSlug}/${c.caseId}`}
                    className="text-foreground hover:text-accent"
                  >
                    {c.clinicalHistory || c.diagnosisTitle || `Case ${c.caseNumber}`}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={c.difficulty} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
