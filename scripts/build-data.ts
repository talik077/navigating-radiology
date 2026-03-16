#!/usr/bin/env npx tsx
/**
 * Build data pipeline: merges extracted course + case data into
 * per-course JSON files consumed by Next.js at build time.
 *
 * Input:
 *   content/courses/all_courses_extracted.json  (22 courses with metadata)
 *   content/cases/{courseSlug}_{caseId}.json     (680 enriched case files)
 *
 * Output:
 *   src/data/course-index.json                  (course listing)
 *   src/data/courses/{courseSlug}.json           (per-course with full case data)
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const CONTENT = path.join(ROOT, "content");
const DATA_OUT = path.join(__dirname, "../src/data");
const COURSES_OUT = path.join(DATA_OUT, "courses");

// Ensure output dirs exist
fs.mkdirSync(COURSES_OUT, { recursive: true });

// Load course metadata
const coursesRaw = JSON.parse(
  fs.readFileSync(path.join(CONTENT, "courses/all_courses_extracted.json"), "utf-8")
);

// Load YouTube intro videos (extracted from original site via browser)
const youtubeIntrosPath = path.join(CONTENT, "youtube-intros.json");
const youtubeByCourse: Record<string, { title: string; youtubeId: string }[]> = fs.existsSync(youtubeIntrosPath)
  ? JSON.parse(fs.readFileSync(youtubeIntrosPath, "utf-8"))
  : {};
console.log(`Loaded YouTube intros for ${Object.keys(youtubeByCourse).length} courses`);

// Load section boundaries (scraped from original site)
const sectionBoundariesPath = path.join(CONTENT, "section-boundaries.json");
const sectionBoundaries: Record<string, { section: string; firstCase: number; lastCase: number }[]> =
  fs.existsSync(sectionBoundariesPath)
    ? JSON.parse(fs.readFileSync(sectionBoundariesPath, "utf-8"))
    : {};
console.log(`Loaded section boundaries for ${Object.keys(sectionBoundaries).length} courses`);

// Load Vimeo video URLs if extraction file exists
const vimeoPath = path.join(CONTENT, "vimeo-urls.json");
const vimeoByCase: Record<string, string> = {};
if (fs.existsSync(vimeoPath)) {
  const vimeoData: { courseSlug: string; caseId: string; videoUrl: string }[] =
    JSON.parse(fs.readFileSync(vimeoPath, "utf-8"));
  for (const v of vimeoData) {
    vimeoByCase[`${v.courseSlug}_${v.caseId}`] = v.videoUrl;
  }
  console.log(`Loaded ${Object.keys(vimeoByCase).length} Vimeo URLs`);
}

// Load Vimeo history video URLs if extraction file exists
const vimeoHistoryPath = path.join(CONTENT, "vimeo-history-urls.json");
const vimeoHistoryByCase: Record<string, string> = {};
if (fs.existsSync(vimeoHistoryPath)) {
  const vimeoHistoryData: { courseSlug: string; caseId: string; historyVideoUrl: string }[] =
    JSON.parse(fs.readFileSync(vimeoHistoryPath, "utf-8"));
  for (const v of vimeoHistoryData) {
    vimeoHistoryByCase[`${v.courseSlug}_${v.caseId}`] = v.historyVideoUrl;
  }
  console.log(`Loaded ${Object.keys(vimeoHistoryByCase).length} Vimeo history URLs`);
}

// Load all case files and index by courseSlug
const casesDir = path.join(CONTENT, "cases");
const caseFiles = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"));
const casesBySlug: Record<string, any[]> = {};

for (const file of caseFiles) {
  const caseData = JSON.parse(fs.readFileSync(path.join(casesDir, file), "utf-8"));
  const slug = caseData.courseSlug;
  if (!casesBySlug[slug]) casesBySlug[slug] = [];
  casesBySlug[slug].push(caseData);
}

// Build course type groupings
const courseTypeMap: Record<string, { slug: string; name: string; description: string; courses: any[] }> = {
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

let totalCases = 0;

for (const course of coursesRaw) {
  const slug = course.courseSlug;
  const cases = casesBySlug[slug] || [];

  // Build case-level data keyed by caseId from extracted course metadata
  const courseMetaCases: Record<string, any> = {};
  for (const mc of course.cases || []) {
    courseMetaCases[mc.caseId] = mc;
  }

  // Merge: enriched case data + course-level metadata (clinicalHistory, difficulty, caseNumber)
  const mergedCases = cases
    .map((c: any) => {
      const meta = courseMetaCases[c.caseId] || {};
      const study = c.study || {};
      const series = (study.series || []).map((s: any) => ({
        label: s.label || "",
        modality: s.modality || "CT",
        seriesUID: s.SeriesInstanceUID || s.seriesUID || s._id || "",
        window: s.window || undefined,
        sliceCount: (s.instances || []).length,
        instances: (s.instances || []).map((inst: any) => ({
          uid: inst.uid || inst._id || "",
          url: inst.url || "",
          originalSize: inst.originalSize,
          compressedSize: inst.compressedSize,
          annotations: inst.annotations || undefined,
        })),
      }));

      // Parse case number from diagnosisTitle ("Case 14 - Pregnancy loss" → 14)
      const titleMatch = (c.diagnosisTitle || "").match(/^Case\s+(\d+)/i);
      const parsedCaseNumber = titleMatch ? parseInt(titleMatch[1], 10) : 0;

      return {
        caseId: c.caseId,
        caseNumber: parsedCaseNumber,
        clinicalHistory: meta.clinicalHistory || "",
        diagnosisTitle: c.diagnosisTitle || "",
        difficulty: meta.difficulty || undefined,
        study: {
          uid: study.uid || study._id || "",
          description: study.description || study.name || "",
          series,
        },
        teachingSections: c.teachingSections || [],
        videoUrl: vimeoByCase[`${slug}_${c.caseId}`] || c.videoUrl || undefined,
        historyVideoUrl: vimeoHistoryByCase[`${slug}_${c.caseId}`] || undefined,
      };
    })
    .sort((a: any, b: any) => a.caseNumber - b.caseNumber);

  // Use section boundaries to build proper sections and assign sectionIndex to cases
  const boundaries = sectionBoundaries[slug] || [];
  const outputSections = boundaries.map((b) => b.section);

  // Assign sectionIndex to each case based on boundaries
  for (const c of mergedCases) {
    const idx = boundaries.findIndex(
      (b) => c.caseNumber >= b.firstCase && c.caseNumber <= b.lastCase
    );
    (c as any).sectionIndex = idx >= 0 ? idx : 0;
  }

  // Fallback: if no boundaries, use original sections (minus "How to Work Through")
  const fallbackSections = ([...new Set(course.sections || [])] as string[])
    .filter((s) => !s.toLowerCase().includes("how to work through"));

  // Per-course output
  const courseOutput = {
    courseSlug: slug,
    courseType: course.courseType,
    courseName: course.courseName,
    description: course.description || "",
    caseCount: mergedCases.length,
    sections: outputSections.length > 0 ? outputSections : fallbackSections,
    introUrl: course.introUrl || undefined,
    introVideos: youtubeByCourse[slug] || [],
    cases: mergedCases,
  };

  fs.writeFileSync(
    path.join(COURSES_OUT, `${slug}.json`),
    JSON.stringify(courseOutput)
  );

  // Add to index
  const ct = courseTypeMap[course.courseType];
  if (ct) {
    ct.courses.push({
      courseSlug: slug,
      courseType: course.courseType,
      courseName: course.courseName,
      description: course.description || "",
      caseCount: mergedCases.length,
      sections: outputSections.length > 0 ? outputSections : fallbackSections,
      introUrl: course.introUrl || undefined,
    });
  }

  totalCases += mergedCases.length;
  console.log(`  ${slug}: ${mergedCases.length} cases, ${series_count(mergedCases)} series`);
}

function series_count(cases: any[]) {
  return cases.reduce((sum: number, c: any) => sum + (c.study?.series?.length || 0), 0);
}

// Write course index
const courseIndex = {
  courseTypes: Object.values(courseTypeMap).filter((ct) => ct.courses.length > 0),
};

fs.writeFileSync(path.join(DATA_OUT, "course-index.json"), JSON.stringify(courseIndex, null, 2));

console.log(`\nDone: ${totalCases} cases across ${coursesRaw.length} courses`);
console.log(`Output: ${DATA_OUT}/`);
