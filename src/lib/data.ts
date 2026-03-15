import * as fs from "fs";
import * as path from "path";
import type { CourseIndex, CourseData, CaseData, StudySummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "src/data");

// Cache loaded data in memory (per-process, survives HMR in dev)
const cache = new Map<string, unknown>();

function readJSON<T>(filePath: string): T | null {
  if (cache.has(filePath)) return cache.get(filePath) as T;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as T;
    cache.set(filePath, data);
    return data;
  } catch {
    return null;
  }
}

export function getCourseIndex(): CourseIndex {
  return readJSON<CourseIndex>(path.join(DATA_DIR, "course-index.json"))!;
}

export function getCourseData(courseSlug: string): CourseData | null {
  return readJSON<CourseData>(path.join(DATA_DIR, "courses", `${courseSlug}.json`));
}

export function getCaseData(courseSlug: string, caseId: string): CaseData | null {
  const course = getCourseData(courseSlug);
  if (!course) return null;
  return course.cases.find((c) => c.caseId === caseId) || null;
}

export function getAdjacentCases(
  courseSlug: string,
  caseId: string
): { prev: CaseData | null; next: CaseData | null } {
  const course = getCourseData(courseSlug);
  if (!course) return { prev: null, next: null };
  const idx = course.cases.findIndex((c) => c.caseId === caseId);
  return {
    prev: idx > 0 ? course.cases[idx - 1] : null,
    next: idx < course.cases.length - 1 ? course.cases[idx + 1] : null,
  };
}

export function getAllCourseSlugs(): { courseType: string; courseSlug: string }[] {
  const index = getCourseIndex();
  const slugs: { courseType: string; courseSlug: string }[] = [];
  for (const ct of index.courseTypes) {
    for (const c of ct.courses) {
      slugs.push({ courseType: c.courseType, courseSlug: c.courseSlug });
    }
  }
  return slugs;
}

export function getAllCaseParams(): {
  courseType: string;
  courseSlug: string;
  caseId: string;
}[] {
  const params: { courseType: string; courseSlug: string; caseId: string }[] = [];
  for (const { courseType, courseSlug } of getAllCourseSlugs()) {
    const course = getCourseData(courseSlug);
    if (!course) continue;
    for (const c of course.cases) {
      params.push({ courseType, courseSlug, caseId: c.caseId });
    }
  }
  return params;
}

/**
 * Strip instance arrays from study data to create a lightweight summary
 * suitable for passing to client components via props.
 */
export function toStudySummary(caseData: CaseData): StudySummary {
  return {
    uid: caseData.study.uid,
    description: caseData.study.description,
    series: caseData.study.series.map((s) => ({
      label: s.label,
      modality: s.modality,
      seriesUID: s.seriesUID,
      window: s.window,
      sliceCount: s.sliceCount,
    })),
  };
}
