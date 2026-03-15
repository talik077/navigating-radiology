import Link from "next/link";
import { getCourseIndex } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [
    { courseType: "on-call-preparation" },
    { courseType: "mri-based" },
  ];
}

export function generateMetadata({ params }: { params: Promise<{ courseType: string }> }) {
  return params.then(({ courseType }) => {
    const name = courseType === "on-call-preparation" ? "On-Call Prep" : "MRI Based";
    return { title: `${name} Courses | Navigating Radiology` };
  });
}

export default async function CourseTypePage({
  params,
}: {
  params: Promise<{ courseType: string }>;
}) {
  const { courseType } = await params;
  const index = getCourseIndex();
  const ct = index.courseTypes.find((t) => t.slug === courseType);
  if (!ct) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-2">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          &larr; Home
        </Link>
      </div>
      <h1 className="mb-2 text-3xl font-bold">{ct.name}</h1>
      <p className="mb-8 text-muted">{ct.description}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ct.courses
          .filter((c) => c.caseCount > 0)
          .map((course) => (
            <Link
              key={course.courseSlug}
              href={`/courses/${courseType}/${course.courseSlug}`}
              className="group rounded-lg border border-border bg-surface p-5 transition-all hover:border-accent/50 hover:bg-surface-hover"
            >
              <h3 className="mb-2 font-semibold group-hover:text-accent">
                {course.courseName}
              </h3>
              <p className="mb-3 text-xs leading-relaxed text-muted line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{course.caseCount} cases</span>
                <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  View &rarr;
                </span>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
