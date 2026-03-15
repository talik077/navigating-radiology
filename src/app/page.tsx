import Link from "next/link";
import { getCourseIndex } from "@/lib/data";

export default function Home() {
  const index = getCourseIndex();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome banner */}
      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <p className="mb-1">
          <strong>Explore Courses:</strong> Explore our curated case-based
          courses and learning content below, or via the{" "}
          <strong>Courses</strong> dropdown (top-left).
        </p>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Courses</h1>
        <p className="text-muted">
          Featuring scrollable cases with expert walkthroughs, AI feedback, and
          videos that simplify key concepts
        </p>
      </div>

      {/* Course Type Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {index.courseTypes.map((ct) => (
          <div
            key={ct.slug}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            {/* Course type header with image placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-surface-hover to-background">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-20">
                  {ct.slug === "on-call-preparation" ? "CT" : "MRI"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6">
              <h2 className="mb-3 text-2xl font-bold">{ct.name}</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                {ct.description}
              </p>
              <Link
                href={`/courses/${ct.slug}`}
                className="inline-block rounded-lg bg-success px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-success/80"
              >
                Get Started
              </Link>
            </div>

            {/* Quick Access Table */}
            <div className="border-t border-border p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Quick Access
              </h3>
              <div className="space-y-2">
                {ct.courses
                  .filter((c) => c.caseCount > 0)
                  .map((course) => (
                    <Link
                      key={course.courseSlug}
                      href={`/courses/${ct.slug}/${course.courseSlug}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-accent">&#9679;</span>
                        <span>{course.courseName}</span>
                      </span>
                      <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted">
                        {course.caseCount} Cases
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
