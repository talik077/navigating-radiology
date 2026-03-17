import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  CourseIndex,
  CourseSummary,
  CourseData,
  CaseData,
  StudyData,
  SeriesData,
  StudySummary,
  TeachingSection,
} from "@/lib/types";

// -------------------------------------------------------------------
// DB row types (match supabase-schema.sql)
// -------------------------------------------------------------------

interface CourseRow {
  course_slug: string;
  course_type: string;
  course_name: string;
  description: string;
  sections: string[];
  intro_url: string | null;
  intro_videos: { title: string; youtubeId: string }[];
}

interface CaseRow {
  case_id: string;
  course_slug: string;
  case_number: number;
  clinical_history: string;
  diagnosis_title: string;
  difficulty: string | null;
  section_index: number;
  study_uid: string;
  study_description: string;
  teaching_sections: TeachingSection[];
  diagnosis_video_url: string | null;
  history_video_url: string | null;
}

interface SeriesRow {
  course_slug: string;
  case_id: string;
  series_index: number;
  label: string;
  modality: string;
  series_uid: string;
  window_wc: number | null;
  window_ww: number | null;
  slice_count: number;
  instance_urls: string[];
  annotations: { index: number; data: unknown }[];
}

// -------------------------------------------------------------------
// Row → App type mappers
// -------------------------------------------------------------------

function toCourseSummary(row: CourseRow): CourseSummary {
  return {
    courseSlug: row.course_slug,
    courseType: row.course_type,
    courseName: row.course_name,
    description: row.description,
    caseCount: 0, // filled by caller
    sections: row.sections ?? [],
    introUrl: row.intro_url ?? undefined,
  };
}

function toCaseData(row: CaseRow, seriesRows: SeriesRow[]): CaseData {
  const series: SeriesData[] = seriesRows
    .sort((a, b) => a.series_index - b.series_index)
    .map((s) => ({
      label: s.label,
      modality: s.modality,
      seriesUID: s.series_uid,
      window:
        s.window_wc != null && s.window_ww != null
          ? { wc: s.window_wc, ww: s.window_ww }
          : undefined,
      sliceCount: s.slice_count,
      instances: (s.instance_urls ?? []).map((url, idx) => {
        const ann = s.annotations?.find((a) => a.index === idx);
        return {
          uid: `${s.series_uid}.${idx}`,
          url,
          annotations: ann?.data,
        };
      }),
    }));

  const study: StudyData = {
    uid: row.study_uid,
    description: row.study_description,
    series,
  };

  return {
    caseId: row.case_id,
    caseNumber: row.case_number,
    clinicalHistory: row.clinical_history,
    diagnosisTitle: row.diagnosis_title,
    difficulty: row.difficulty ?? undefined,
    study,
    teachingSections: row.teaching_sections ?? [],
    diagnosisVideoUrl: row.diagnosis_video_url ?? undefined,
    historyVideoUrl: row.history_video_url ?? undefined,
    sectionIndex: row.section_index,
  };
}

// -------------------------------------------------------------------
// Public query functions
// -------------------------------------------------------------------

/**
 * Course index for navigation (header dropdown, home page).
 * Cached per request via React `cache()`.
 */
export const getCourseIndex = cache(async (): Promise<CourseIndex> => {
  const supabase = await createClient();

  const { data: courseRows, error } = await supabase
    .from("courses")
    .select("*")
    .order("course_slug");
  if (error) throw error;

  // Count cases per course
  const { data: counts, error: countErr } = await supabase
    .from("cases")
    .select("course_slug")
    .then(({ data }) => {
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        map[row.course_slug] = (map[row.course_slug] || 0) + 1;
      }
      return { data: map, error: null };
    });
  if (countErr) throw countErr;

  // Group by course type
  const typeMap: Record<
    string,
    { slug: string; name: string; description: string; courses: CourseSummary[] }
  > = {
    "on-call-preparation": {
      slug: "on-call-preparation",
      name: "On-Call Prep",
      description:
        "Master the essentials of on-call radiology — the bread-and-butter emergencies you should never miss.",
      courses: [],
    },
    "mri-based": {
      slug: "mri-based",
      name: "MRI Based",
      description:
        "Become an MRI Expert with our comprehensive courses covering the highest yield topics.",
      courses: [],
    },
  };

  for (const row of courseRows ?? []) {
    const summary = toCourseSummary(row);
    summary.caseCount = counts?.[row.course_slug] ?? 0;
    typeMap[row.course_type]?.courses.push(summary);
  }

  return {
    courseTypes: Object.values(typeMap).filter((ct) => ct.courses.length > 0),
  };
});

/**
 * Full course data including all cases (with study + teaching sections).
 * Series data is loaded with instance URLs for API route usage.
 */
export const getCourseData = cache(
  async (courseSlug: string): Promise<CourseData | null> => {
    const supabase = await createClient();

    // Fetch course
    const { data: courseRow, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .eq("course_slug", courseSlug)
      .single();
    if (courseErr || !courseRow) return null;

    // Fetch cases ordered by case_number
    const { data: caseRows, error: caseErr } = await supabase
      .from("cases")
      .select("*")
      .eq("course_slug", courseSlug)
      .order("case_number");
    if (caseErr) throw caseErr;

    // Fetch all series for this course
    const { data: seriesRows, error: seriesErr } = await supabase
      .from("series")
      .select("*")
      .eq("course_slug", courseSlug)
      .order("series_index");
    if (seriesErr) throw seriesErr;

    // Group series by case_id
    const seriesByCase: Record<string, SeriesRow[]> = {};
    for (const s of seriesRows ?? []) {
      if (!seriesByCase[s.case_id]) seriesByCase[s.case_id] = [];
      seriesByCase[s.case_id].push(s);
    }

    const cases: CaseData[] = (caseRows ?? []).map((row) =>
      toCaseData(row, seriesByCase[row.case_id] ?? [])
    );

    return {
      courseSlug: courseRow.course_slug,
      courseType: courseRow.course_type,
      courseName: courseRow.course_name,
      description: courseRow.description,
      caseCount: cases.length,
      sections: courseRow.sections ?? [],
      introUrl: courseRow.intro_url ?? undefined,
      introVideos: courseRow.intro_videos ?? [],
      cases,
    };
  }
);

/**
 * Single case with full study data.
 */
export const getCaseData = cache(
  async (courseSlug: string, caseId: string): Promise<CaseData | null> => {
    const supabase = await createClient();

    const { data: caseRow, error: caseErr } = await supabase
      .from("cases")
      .select("*")
      .eq("course_slug", courseSlug)
      .eq("case_id", caseId)
      .single();
    if (caseErr || !caseRow) return null;

    const { data: seriesRows, error: seriesErr } = await supabase
      .from("series")
      .select("*")
      .eq("course_slug", courseSlug)
      .eq("case_id", caseId)
      .order("series_index");
    if (seriesErr) throw seriesErr;

    return toCaseData(caseRow, seriesRows ?? []);
  }
);

/**
 * Previous and next cases for navigation.
 */
export async function getAdjacentCases(
  courseSlug: string,
  caseId: string
): Promise<{ prev: CaseData | null; next: CaseData | null }> {
  const course = await getCourseData(courseSlug);
  if (!course) return { prev: null, next: null };

  const idx = course.cases.findIndex((c) => c.caseId === caseId);
  return {
    prev: idx > 0 ? course.cases[idx - 1] : null,
    next: idx < course.cases.length - 1 ? course.cases[idx + 1] : null,
  };
}

/**
 * Series data for the DICOM viewer API route.
 */
export async function getSeriesData(
  courseSlug: string,
  caseId: string,
  seriesIndex: number
): Promise<{
  urls: string[];
  window: { wc: number; ww: number } | null;
  annotations: { index: number; data: unknown }[];
} | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("series")
    .select("*")
    .eq("course_slug", courseSlug)
    .eq("case_id", caseId)
    .eq("series_index", seriesIndex)
    .single();
  if (error || !row) return null;

  return {
    urls: row.instance_urls ?? [],
    window:
      row.window_wc != null && row.window_ww != null
        ? { wc: row.window_wc, ww: row.window_ww }
        : null,
    annotations: row.annotations ?? [],
  };
}

/**
 * All course slugs for static generation.
 */
export async function getAllCourseSlugs(): Promise<
  { courseType: string; courseSlug: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("course_type, course_slug");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    courseType: r.course_type,
    courseSlug: r.course_slug,
  }));
}

/**
 * All case params for static generation.
 */
export async function getAllCaseParams(): Promise<
  { courseType: string; courseSlug: string; caseId: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("case_id, course_slug, courses(course_type)")
    .order("course_slug")
    .order("case_number");
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    courseType: r.courses?.course_type ?? "",
    courseSlug: r.course_slug,
    caseId: r.case_id,
  }));
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
