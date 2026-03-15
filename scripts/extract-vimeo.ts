#!/usr/bin/env npx tsx
/**
 * Extract Vimeo video URLs from diagnosis pages on app.navigatingradiology.com.
 *
 * Usage:
 *   1. Log in to app.navigatingradiology.com in a Chrome browser
 *   2. Copy cookies using browser DevTools:
 *      document.cookie → save to content/cookies.txt
 *   3. Run: npx tsx scripts/extract-vimeo.ts
 *
 * Output:
 *   content/vimeo-urls.json  — array of { courseSlug, caseId, videoUrl }
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const CONTENT = path.join(ROOT, "content");
const DATA_DIR = path.join(__dirname, "../src/data/courses");
const OUTPUT = path.join(CONTENT, "vimeo-urls.json");

// Load all courses to get case URLs
const courseFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

interface CaseInfo {
  courseSlug: string;
  courseType: string;
  caseId: string;
}

const allCases: CaseInfo[] = [];

for (const file of courseFiles) {
  const course = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
  for (const c of course.cases || []) {
    allCases.push({
      courseSlug: course.courseSlug,
      courseType: course.courseType,
      caseId: c.caseId,
    });
  }
}

console.log(`Found ${allCases.length} cases to check for Vimeo videos`);

// Load existing results to allow resume
let results: { courseSlug: string; caseId: string; videoUrl: string }[] = [];
const processedSet = new Set<string>();

if (fs.existsSync(OUTPUT)) {
  results = JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
  for (const r of results) {
    processedSet.add(`${r.courseSlug}_${r.caseId}`);
  }
  console.log(`Resuming: ${results.length} already extracted`);
}

// Use fetch with cookies to get page HTML and extract Vimeo URLs
// The Vimeo embed is rendered server-side or via API data

// Actually, the Vimeo URL is likely in the API response, not the HTML.
// Let's check the API endpoint that returns case data.
// The Vue.js app likely fetches from: /api/cases/{caseId} or similar

async function extractVimeoUrl(caseInfo: CaseInfo): Promise<string | null> {
  const url = `https://app.navigatingradiology.com/course-types/${caseInfo.courseType}/courses/${caseInfo.courseSlug}/cases/${caseInfo.caseId}/diagnosis`;

  try {
    // Load cookies
    const cookiePath = path.join(CONTENT, "cookies.txt");
    if (!fs.existsSync(cookiePath)) {
      console.error("Missing cookies.txt! See usage instructions.");
      process.exit(1);
    }
    const cookies = fs.readFileSync(cookiePath, "utf-8").trim();

    const resp = await fetch(url, {
      headers: {
        Cookie: cookies,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (resp.status === 401 || resp.status === 403) {
      console.error("Authentication failed! Re-export cookies.");
      process.exit(1);
    }

    const html = await resp.text();

    // Look for Vimeo player URL in the HTML/inline data
    // Patterns: player.vimeo.com/video/XXXXX or vimeo.com/XXXXX
    const vimeoPatterns = [
      /https?:\/\/player\.vimeo\.com\/video\/(\d+)([^"'\s]*)/g,
      /"videoUrl"\s*:\s*"(https?:\/\/player\.vimeo\.com\/video\/\d+[^"]*)"/g,
      /"video_url"\s*:\s*"(https?:\/\/player\.vimeo\.com\/video\/\d+[^"]*)"/g,
      /vimeo[^"]*?(\d{6,})/g,
    ];

    for (const pattern of vimeoPatterns) {
      const match = pattern.exec(html);
      if (match) {
        // Return the full Vimeo player URL
        if (match[0].includes("player.vimeo.com")) {
          return match[0].replace(/["'\s].*/g, "");
        }
        // If we just got a Vimeo ID
        const id = match[1];
        if (id && id.length >= 6) {
          return `https://player.vimeo.com/video/${id}`;
        }
      }
    }

    return null;
  } catch (err: any) {
    console.error(`  Error fetching ${caseInfo.caseId}: ${err.message}`);
    return null;
  }
}

async function main() {
  const remaining = allCases.filter(
    (c) => !processedSet.has(`${c.courseSlug}_${c.caseId}`)
  );
  console.log(`${remaining.length} cases remaining to check`);

  let found = 0;
  let checked = 0;
  const batchSize = 5; // Concurrent requests

  for (let i = 0; i < remaining.length; i += batchSize) {
    const batch = remaining.slice(i, i + batchSize);
    const promises = batch.map(async (caseInfo) => {
      const videoUrl = await extractVimeoUrl(caseInfo);
      if (videoUrl) {
        results.push({
          courseSlug: caseInfo.courseSlug,
          caseId: caseInfo.caseId,
          videoUrl,
        });
        found++;
      }
      checked++;
    });

    await Promise.all(promises);

    // Save progress every batch
    if (checked % 50 === 0 || i + batchSize >= remaining.length) {
      fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
      process.stdout.write(
        `\r  Checked ${checked}/${remaining.length}, found ${found} Vimeo URLs`
      );
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(
    `\n\nDone: ${results.length} total Vimeo URLs found out of ${allCases.length} cases`
  );
  console.log(`Output: ${OUTPUT}`);
}

main().catch(console.error);
