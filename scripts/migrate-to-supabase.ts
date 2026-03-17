#!/usr/bin/env npx tsx
/**
 * Migrate course/case/series data from JSON files to Supabase.
 *
 * Prerequisites:
 *   1. Run supabase-schema.sql in the Supabase SQL Editor first
 *   2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DATA_DIR = path.resolve(__dirname, "../src/data");
const COURSES_DIR = path.join(DATA_DIR, "courses");

interface CourseJSON {
  courseSlug: string;
  courseType: string;
  courseName: string;
  description: string;
  caseCount: number;
  sections: string[];
  introUrl?: string;
  introVideos?: { title: string; youtubeId: string }[];
  cases: CaseJSON[];
}

interface CaseJSON {
  caseId: string;
  caseNumber: number;
  clinicalHistory: string;
  diagnosisTitle: string;
  difficulty?: string;
  sectionIndex?: number;
  study: {
    uid: string;
    description: string;
    series: SeriesJSON[];
  };
  teachingSections: { name: string; html: string }[];
  diagnosisVideoUrl?: string;
  historyVideoUrl?: string;
}

interface SeriesJSON {
  label: string;
  modality: string;
  seriesUID: string;
  window?: { wc: number; ww: number };
  sliceCount: number;
  instances: {
    uid: string;
    url: string;
    originalSize?: number;
    compressedSize?: number;
    annotations?: unknown;
  }[];
}

// -------------------------------------------------------------------
// Batch upsert helper — splits into chunks to stay within Supabase limits
// -------------------------------------------------------------------
async function batchUpsert(
  table: string,
  rows: Record<string, unknown>[],
  conflictCols: string,
  batchSize = 500
) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflictCols });
    if (error) {
      console.error(`Error upserting into ${table} (batch ${i}):`, error.message);
      throw error;
    }
    inserted += batch.length;
  }
  return inserted;
}

// -------------------------------------------------------------------
// Main migration
// -------------------------------------------------------------------
async function main() {
  const files = fs
    .readdirSync(COURSES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Found ${files.length} course files\n`);

  const courseRows: Record<string, unknown>[] = [];
  const caseRows: Record<string, unknown>[] = [];
  const seriesRows: Record<string, unknown>[] = [];

  for (const file of files) {
    const course: CourseJSON = JSON.parse(
      fs.readFileSync(path.join(COURSES_DIR, file), "utf-8")
    );

    // Course row
    courseRows.push({
      course_slug: course.courseSlug,
      course_type: course.courseType,
      course_name: course.courseName,
      description: course.description || "",
      sections: course.sections || [],
      intro_url: course.introUrl || null,
      intro_videos: course.introVideos || [],
    });

    // Case + series rows
    for (const c of course.cases) {
      caseRows.push({
        case_id: c.caseId,
        course_slug: course.courseSlug,
        case_number: c.caseNumber,
        clinical_history: c.clinicalHistory || "",
        diagnosis_title: c.diagnosisTitle || "",
        difficulty: c.difficulty || null,
        section_index: c.sectionIndex ?? 0,
        study_uid: c.study.uid,
        study_description: c.study.description || "",
        teaching_sections: c.teachingSections || [],
        diagnosis_video_url: c.diagnosisVideoUrl || null,
        history_video_url: c.historyVideoUrl || null,
      });

      for (let si = 0; si < c.study.series.length; si++) {
        const ser = c.study.series[si];
        const annotations: { index: number; data: unknown }[] = [];
        const urls = ser.instances.map((inst, idx) => {
          if (inst.annotations) {
            annotations.push({ index: idx, data: inst.annotations });
          }
          return inst.url;
        });

        seriesRows.push({
          course_slug: course.courseSlug,
          case_id: c.caseId,
          series_index: si,
          label: ser.label || "",
          modality: ser.modality || "CT",
          series_uid: ser.seriesUID,
          window_wc: ser.window?.wc ?? null,
          window_ww: ser.window?.ww ?? null,
          slice_count: ser.sliceCount,
          instance_urls: urls,
          annotations: annotations.length > 0 ? annotations : [],
        });
      }
    }

    console.log(
      `  ${course.courseSlug}: ${course.cases.length} cases, ${course.cases.reduce((s, c) => s + c.study.series.length, 0)} series`
    );
  }

  // Upsert in order: courses → cases → series (foreign key dependencies)
  console.log(`\nUpserting ${courseRows.length} courses...`);
  await batchUpsert("courses", courseRows, "course_slug");

  console.log(`Upserting ${caseRows.length} cases...`);
  await batchUpsert("cases", caseRows, "course_slug,case_id");

  console.log(`Upserting ${seriesRows.length} series...`);
  await batchUpsert("series", seriesRows, "course_slug,case_id,series_index");

  // Validate
  console.log("\nValidating...");
  const { count: courseCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });
  const { count: caseCount } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true });
  const { count: seriesCount } = await supabase
    .from("series")
    .select("*", { count: "exact", head: true });

  console.log(`  courses: ${courseCount} (expected ${courseRows.length})`);
  console.log(`  cases:   ${caseCount} (expected ${caseRows.length})`);
  console.log(`  series:  ${seriesCount} (expected ${seriesRows.length})`);

  const allMatch =
    courseCount === courseRows.length &&
    caseCount === caseRows.length &&
    seriesCount === seriesRows.length;

  if (allMatch) {
    console.log("\nMigration complete — all counts match.");
  } else {
    console.error("\nWARNING: Row counts do not match! Check for errors above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
