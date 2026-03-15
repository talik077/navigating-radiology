import { getCourseData, getAllCourseSlugs } from "@/lib/data";
import { notFound } from "next/navigation";
import CourseContent from "./CourseContent";

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

export default async function CourseSlugPage({
  params,
}: {
  params: Promise<{ courseType: string; courseSlug: string }>;
}) {
  const { courseType, courseSlug } = await params;
  const course = getCourseData(courseSlug);
  if (!course) notFound();

  return <CourseContent course={course} courseType={courseType} courseSlug={courseSlug} />;
}
