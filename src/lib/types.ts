export interface CourseIndex {
  courseTypes: {
    slug: string;
    name: string;
    description: string;
    courses: CourseSummary[];
  }[];
}

export interface CourseSummary {
  courseSlug: string;
  courseType: string;
  courseName: string;
  description: string;
  caseCount: number;
  sections: string[];
  introUrl?: string;
}

export interface CourseData {
  courseSlug: string;
  courseType: string;
  courseName: string;
  description: string;
  caseCount: number;
  sections: string[];
  introUrl?: string;
  cases: CaseData[];
}

export interface CaseData {
  caseId: string;
  caseNumber: number;
  clinicalHistory: string;
  diagnosisTitle: string;
  difficulty?: string;
  study: StudyData;
  teachingSections: TeachingSection[];
  videoUrl?: string;
}

export interface StudyData {
  uid: string;
  description: string;
  series: SeriesData[];
}

export interface SeriesData {
  label: string;
  modality: string;
  seriesUID: string;
  window?: { wc: number; ww: number };
  sliceCount: number;
  instances: InstanceData[];
}

export interface InstanceData {
  uid: string;
  url: string;
  originalSize?: number;
  compressedSize?: number;
  annotations?: unknown;
}

export interface TeachingSection {
  name: string;
  html: string;
}

/**
 * Lightweight series info for the client viewer (no instance URLs).
 * Instance URLs are fetched on-demand via API.
 */
export interface SeriesSummary {
  label: string;
  modality: string;
  seriesUID: string;
  window?: { wc: number; ww: number };
  sliceCount: number;
}

export interface StudySummary {
  uid: string;
  description: string;
  series: SeriesSummary[];
}
