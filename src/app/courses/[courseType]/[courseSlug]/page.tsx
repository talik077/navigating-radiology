import Link from "next/link";
import Image from "next/image";
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
  return {
    title: `${course?.courseName || courseSlug} | Navigating Radiology`,
  };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const colors: Record<string, string> = {
    "Bread & Butter": "bg-success/20 text-success",
    Moderate: "bg-warning/20 text-warning",
    Challenging: "bg-danger/20 text-danger",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[difficulty] || "bg-muted/20 text-muted"}`}
    >
      {difficulty}
    </span>
  );
}

function StatCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <span className="shrink-0 text-accent">{icon}</span>
      <span className="text-sm text-muted">{text}</span>
    </div>
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

  // Sort cases by caseNumber (original site order)
  const sortedCases = [...course.cases].sort(
    (a, b) => a.caseNumber - b.caseNumber
  );

  // Group cases by section — distribute proportionally
  const sections = course.sections || [];
  type SectionGroup = { name: string; cases: typeof course.cases };
  const sectionGroups: SectionGroup[] = [];

  if (sections.length > 0) {
    const casesPerSection = Math.ceil(
      sortedCases.length / sections.length
    );
    let caseIdx = 0;
    for (let i = 0; i < sections.length; i++) {
      const isLast = i === sections.length - 1;
      const count = isLast
        ? sortedCases.length - caseIdx
        : casesPerSection;
      sectionGroups.push({
        name: sections[i],
        cases: sortedCases.slice(caseIdx, caseIdx + count),
      });
      caseIdx += count;
    }
  } else {
    sectionGroups.push({ name: "Cases", cases: sortedCases });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/courses/${courseType}`}
          className="flex items-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold">{course.courseName}</h1>
      </div>

      {/* Hero section */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Thumbnail */}
          <div className="relative h-48 w-full overflow-hidden md:h-auto md:w-72">
            <Image
              src={`/images/courses/${courseSlug}.png`}
              alt={course.courseName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 288px"
            />
          </div>
          <div className="flex-1 p-6">
            <h2 className="mb-3 text-xl font-bold">{course.courseName}</h2>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              {course.description}
            </p>
            {sections.length > 0 && (
              <div className="mb-4">
                <strong className="text-sm">Sections:</strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[...new Set(sections)].map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Introduction Videos */}
      {course.introVideos && course.introVideos.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Introduction</h3>
          <div className={`grid gap-4 ${course.introVideos.length > 1 ? "md:grid-cols-2" : ""}`}>
            {course.introVideos.map((vid, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${vid.youtubeId}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={vid.title}
                  loading="lazy"
                />
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          }
          text="Introductory Video"
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
          text={`${course.caseCount} Cases Available`}
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
          text="Expert Walkthroughs"
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          }
          text="Video Driven Mode"
        />
      </div>

      {/* Cases heading */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cases</h3>
      </div>

      <hr className="mb-6 border-border" />

      {/* Case table grouped by sections */}
      {sectionGroups.map((group, gi) => (
        <div key={gi} className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <span className="h-4 w-1 rounded-full bg-accent" />
            {group.name}
          </h4>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover text-xs text-muted">
                  <th className="w-24 px-4 py-2 text-left font-medium">Case #</th>
                  <th className="px-4 py-2 text-left font-medium">Clinical History</th>
                  <th className="w-32 px-4 py-2 text-right font-medium">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {group.cases.map((c) => (
                  <tr
                    key={c.caseId}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover"
                  >
                    <td className="w-24 px-4 py-3 text-muted">
                      <span className="mr-2 text-success">&#9679;</span>
                      Case {c.caseNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/courses/${courseType}/${courseSlug}/${c.caseId}`}
                        className="text-foreground hover:text-accent"
                      >
                        {c.clinicalHistory ||
                          c.diagnosisTitle ||
                          `Case ${c.caseNumber}`}
                      </Link>
                    </td>
                    <td className="w-32 px-4 py-3 text-right">
                      <DifficultyBadge difficulty={c.difficulty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
