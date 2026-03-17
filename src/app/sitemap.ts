import type { MetadataRoute } from "next";
import { getCourseIndex, getCourseData } from "@/lib/db/queries";

const BASE_URL = "https://navigatingradiology.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const index = await getCourseIndex();
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  ];

  for (const ct of index.courseTypes) {
    entries.push({
      url: `${BASE_URL}/courses/${ct.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const c of ct.courses) {
      entries.push({
        url: `${BASE_URL}/courses/${ct.slug}/${c.courseSlug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });

      const course = await getCourseData(c.courseSlug);
      if (!course) continue;

      for (const cas of course.cases) {
        entries.push({
          url: `${BASE_URL}/courses/${ct.slug}/${c.courseSlug}/${cas.caseId}`,
          changeFrequency: "monthly",
          priority: 0.5,
        });
        entries.push({
          url: `${BASE_URL}/courses/${ct.slug}/${c.courseSlug}/${cas.caseId}/diagnosis`,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    }
  }

  return entries;
}
