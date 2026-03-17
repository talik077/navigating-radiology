import { getCourseData } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import CourseContent from "./CourseContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = await getCourseData(courseSlug);
  return {
    title: `${course?.courseName || courseSlug} | Navigating Radiology`,
  };
}

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string }>;
}) {
  const { courseType, courseSlug } = await params;
  const course = await getCourseData(courseSlug);
  if (!course) notFound();

  return <CourseContent course={course} courseType={courseType} courseSlug={courseSlug} />;
}
