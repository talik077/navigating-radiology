import Link from "next/link";
import Image from "next/image";
import { getCourseIndex } from "@/lib/data";

const heroImages: Record<string, string> = {
  "on-call-preparation": "/images/on-call-hero.png",
  "mri-based": "/images/mri-hero.png",
};

export default function Home() {
  const index = getCourseIndex();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome banner */}
      <div className="mb-10 rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-2 text-3xl font-bold">Welcome to Navigating Radiology</h1>
        <p className="max-w-2xl text-muted">
          Featuring scrollable cases with expert walkthroughs, AI feedback, and
          videos that simplify key concepts. Explore our curated courses below.
        </p>
      </div>

      {/* Course Type Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {index.courseTypes.map((ct) => (
          <div
            key={ct.slug}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            {/* Hero image */}
            <div className="relative h-52 overflow-hidden bg-background">
              {heroImages[ct.slug] ? (
                <Image
                  src={heroImages[ct.slug]}
                  alt={ct.name}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-muted/20">
                  {ct.slug === "on-call-preparation" ? "CT" : "MRI"}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">{ct.name}</h2>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-4 pt-3">
              <p className="mb-4 text-sm leading-relaxed text-muted">
                {ct.description}
              </p>
              <Link
                href={`/courses/${ct.slug}`}
                className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                View All Courses
              </Link>
            </div>

            {/* Quick Access Table */}
            <div className="border-t border-border px-4 py-4">
              <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Quick Access
              </h3>
              <div className="space-y-0.5">
                {ct.courses
                  .filter((c) => c.caseCount > 0)
                  .map((course) => (
                    <Link
                      key={course.courseSlug}
                      href={`/courses/${ct.slug}/${course.courseSlug}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                    >
                      <span className="flex items-center gap-2">
                        <Image
                          src={`/images/courses/${course.courseSlug}.png`}
                          alt=""
                          width={28}
                          height={28}
                          className="rounded object-cover"
                        />
                        <span>{course.courseName}</span>
                      </span>
                      <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs text-muted">
                        {course.caseCount} cases
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
