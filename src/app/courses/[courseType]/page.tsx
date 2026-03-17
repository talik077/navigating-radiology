import { getCourseIndex } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import CourseTypeContent from "./CourseTypeContent";

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
  const index = await getCourseIndex();
  const ct = index.courseTypes.find((t) => t.slug === courseType);
  if (!ct) notFound();

  return <CourseTypeContent courseType={courseType} ct={ct} />;
}
