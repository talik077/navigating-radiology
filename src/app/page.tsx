import Link from "next/link";
import { getCourseIndex } from "@/lib/data";

export default function Home() {
  const index = getCourseIndex();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Navigating <span className="text-accent">Radiology</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          Master radiology with expert-led, scrollable case-based courses
          featuring AI feedback and video walkthroughs.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {index.courseTypes.map((ct) => (
          <Link
            key={ct.slug}
            href={`/courses/${ct.slug}`}
            className="group rounded-xl border border-border bg-surface p-8 transition-all hover:border-accent/50 hover:bg-surface-hover"
          >
            <div className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
              {ct.slug === "on-call-preparation" ? "CT Focused" : "MRI Focused"}
            </div>
            <h2 className="mb-3 text-2xl font-bold group-hover:text-accent">
              {ct.name}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              {ct.description}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {ct.courses.length} courses &middot;{" "}
                {ct.courses.reduce((sum, c) => sum + c.caseCount, 0)} cases
              </span>
              <span className="text-accent group-hover:translate-x-1 transition-transform">
                Explore &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
