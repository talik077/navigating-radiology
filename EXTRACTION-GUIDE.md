# Data Extraction Guide — Navigating Radiology

Complete instructions for extracting and syncing data from `app.navigatingradiology.com`.

## Architecture of the Original Site

- **Stack**: Laravel (PHP) + Vue.js (Inertia.js) + MongoDB
- **DICOM hosting**: Orthanc DICOM server (self-hosted)
- **Videos**: Vimeo (private/unlisted, embedded via iframe)
- **Auth**: Laravel session auth + Google OAuth
- **Login credentials**: `gabig1@gmail.com` / `Ghij5678!`
- **Cloudflare protection**: Has Turnstile challenge, but session cookies bypass it

## Data Sources

### 1. Course Metadata
**URL pattern**: `https://app.navigatingradiology.com/course-types/{courseType}/courses/{courseSlug}`
**Method**: MCP Playwright browser — the data is embedded in the page via Inertia.js

There are 2 course types:
- `on-call-preparation` — CT-based courses
- `mri-based` — MRI courses

Each has multiple courses (e.g., `ct-abdomenpelvis`, `brain-mri`, `liver-mri`).

### 2. Case Data (Study + Teaching Content)
**URL pattern**: `https://app.navigatingradiology.com/course-types/{courseType}/courses/{courseSlug}/cases/{caseId}/diagnosis`
**Method**: MCP Playwright browser

**Critical**: The study data is embedded in a `<script>` tag as:
```javascript
var studydata = JSON.parse('{...}');
```

This JSON contains:
- `_id` — MongoDB ObjectId of the study
- `uid` — Orthanc study UID
- `name` — Study name
- `series[]` — Array of series, each with:
  - `_id.$oid` — MongoDB ObjectId (used in teaching link `?s=` parameter)
  - `seriesUID` — DICOM Series UID
  - `label` — Series description
  - `instances[]` — Array of instances, each with:
    - `_id.$oid` — MongoDB ObjectId (used in teaching link `?i=` parameter)
    - `uid` — Orthanc instance UID
    - `url` — DICOM file URL on Orthanc server

**Extraction code (run in browser console on diagnosis page)**:
```javascript
const scripts = document.querySelectorAll('script');
for (const s of scripts) {
  if (s.textContent?.includes('var studydata')) {
    const match = s.textContent.match(/var studydata = JSON\.parse\('(.+?)'\)/);
    if (match) {
      const data = JSON.parse(match[1].replace(/\\u0022/g, '"').replace(/\\\\/g, '\\'));
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
```

### 3. Teaching HTML with Interactive Links
The teaching content HTML is also in the `studydata` script block, in the `notes` field.

**Important**: The original HTML has `title="Series X, image Y"` attributes on teaching links that tell you the exact series number and image number. Example:
```html
<a class="auto-scroll" href="?s=622bac...&i=622bac...&ww=400&wc=40&an=true" title="Series 1, image 192">Mural hyperenhancement</a>
```

Our initial extraction LOST these title attributes. To fix teaching links, you need to:
1. Re-extract the HTML preserving `title` attributes, OR
2. Use the `studydata` JSON to build a mapping: MongoDB ObjectId → (series index, instance index)

### 4. Vimeo Video URLs (Diagnosis Page)
**Method**: MCP Playwright browser — Vimeo iframes are injected by Vue.js client-side

**Extraction code (run in browser console on diagnosis page)**:
```javascript
const iframe = document.querySelector('iframe[src*="player.vimeo.com"]');
if (iframe) console.log(iframe.src);
```

**Batch extraction via fetch (faster)**: Navigate to any page on the site first (to have session cookies), then:
```javascript
const resp = await fetch(
  'https://app.navigatingradiology.com/course-types/on-call-preparation/courses/ct-abdomenpelvis/cases/81542/diagnosis',
  { credentials: 'include' }
);
const html = await resp.text();
const match = html.match(/player\.vimeo\.com\/video\/(\d+)\?h=([a-f0-9]+)/);
if (match) console.log(`https://player.vimeo.com/video/${match[1]}?h=${match[2]}`);
```

**Important**: The fetch-based approach works for ct-abdomenpelvis and liver-mri but NOT for brain-mri (brain-mri uses a different rendering pattern where Vimeo iframes are rendered only by Vue.js on the client side, not in the initial HTML).

For brain-mri, you MUST use MCP Playwright to actually navigate to each page and wait for Vue.js to render, then extract the iframe src.

### 5. Vimeo Video URLs (History Page)
**URL pattern**: `.../cases/{caseId}/history`
**Same approach as diagnosis videos**, but:
- Only `ct-abdomenpelvis` cases have history page videos
- `brain-mri` and `liver-mri` do NOT have history page videos (they use "Self-Driven" mode)
- History and diagnosis pages have DIFFERENT videos for the same case

### 6. YouTube Intro Videos
**Location**: Course listing pages
**Method**: Parse the page HTML for YouTube embed URLs
**Format**: `youtube.com/embed/{videoId}`

Already extracted to `content/youtube-intros.json`.

### 7. Teaching Images
**Location**: Teaching HTML content references `https://navigatingrad.imgix.net/...` URLs
**Method**: Download each image, save to `public/images/teaching/{courseSlug}/`, update HTML refs

Already done — 270 images downloaded and referenced locally.

## MongoDB ObjectId → Series/Instance Mapping

The teaching links use MongoDB ObjectIds for `?s=` (series) and `?i=` (instance) parameters.
Our data uses DICOM UIDs. The mapping is:

### Option A: Use title attributes (preferred)
The original HTML has `title="Series X, image Y"` on teaching links.
- "Series 1" = series index 0 (1-indexed in title, 0-indexed in array)
- "image 192" = slice index 191 (1-indexed in title, 0-indexed in array)

### Option B: Build mapping from studydata
Extract the `studydata` JSON from each diagnosis page. It contains both:
- `series[i]._id.$oid` — the MongoDB ObjectId used in `?s=` parameter
- `series[i].instances[j]._id.$oid` — the MongoDB ObjectId used in `?i=` parameter

Match these against the teaching link parameters to get (series index, instance index).

### Option C: Re-extract with full mapping (build-time script)
Create a script that:
1. Navigates to each diagnosis page
2. Extracts `studydata` JSON
3. Builds `mongoId → {seriesIdx, instanceIdx}` mapping
4. Rewrites teaching HTML links to use numeric indices
5. Saves updated teaching HTML to course JSON files

## How to Log In via MCP Browser

```
1. Navigate to: https://app.navigatingradiology.com/login
2. Fill form:
   - Email: gabig1@gmail.com
   - Password: Ghij5678!
3. Click Submit
4. Wait for redirect to dashboard
```

**Note**: The login form uses Cloudflare Turnstile which may interfere. If login fails:
- Try filling email first, wait 1 second, then fill password and submit
- The site remembers sessions — once logged in, cookies persist

## Batch Extraction Pattern (fetch-based, fastest)

Once logged in via MCP browser, use `fetch()` with `credentials: 'include'` to batch-extract:

```javascript
// Run this in the browser console after logging in
async function extractCase(courseType, courseSlug, caseId) {
  const url = `https://app.navigatingradiology.com/course-types/${courseType}/courses/${courseSlug}/cases/${caseId}/diagnosis`;
  const resp = await fetch(url, { credentials: 'include' });
  const html = await resp.text();

  // Extract Vimeo video URL
  const vimeoMatch = html.match(/player\.vimeo\.com\/video\/(\d+)\?h=([a-f0-9]+)/);
  const videoUrl = vimeoMatch
    ? `https://player.vimeo.com/video/${vimeoMatch[1]}?h=${vimeoMatch[2]}`
    : null;

  // Extract studydata JSON (contains MongoDB ObjectId mappings)
  let studydata = null;
  const sdMatch = html.match(/var studydata = JSON\.parse\('(.+?)'\)/);
  if (sdMatch) {
    const raw = sdMatch[1]
      .replace(/\\u0022/g, '"')
      .replace(/\\u0027/g, "'")
      .replace(/\\\\/g, '\\');
    studydata = JSON.parse(raw);
  }

  return { caseId, videoUrl, studydata };
}
```

## File Locations

| File | Description |
|------|-------------|
| `content/youtube-intros.json` | YouTube intro video IDs per course |
| `content/vimeo-urls.json` | Vimeo diagnosis video URLs (130 total) |
| `content/vimeo-history-urls.json` | Vimeo history video URLs (44, ct-abdomenpelvis only) |
| `src/data/courses/*.json` | Merged course data (cases + videos + teaching) |
| `public/images/teaching/**` | Downloaded teaching images (270 total) |
| `scripts/build-data.ts` | Merges raw content → course JSON files |

## Keeping Data in Sync (Future Updates)

To check for new/updated content:

### Quick diff check
1. Log in via MCP browser
2. For each course, navigate to the course page and count cases
3. Compare with our `caseCount` in course JSON
4. If counts differ, extract the new/changed cases

### Full re-sync
1. Re-run extraction for all 680 cases (takes ~30 min with fetch-based approach)
2. Compare extracted data with existing JSON files
3. Download any new teaching images
4. Re-extract Vimeo URLs for new cases
5. Run `scripts/build-data.ts` to merge
6. Commit and push

### Automated daily job (conceptual)
```bash
#!/bin/bash
# 1. Start headless browser, log in
# 2. For each course:
#    a. Fetch course page, get case list
#    b. Compare with local data
#    c. For new/changed cases, extract full data
# 3. Download new teaching images
# 4. Update vimeo-urls.json
# 5. Run build-data.ts
# 6. If changes detected, commit and push
# 7. Vercel auto-deploys from main branch
```

Note: Automating login with Cloudflare Turnstile is challenging.
Consider using Playwright with `--user-data-dir` to persist session cookies.

## Known Issues & Gotchas

1. **Brain-MRI Vimeo extraction**: fetch-based extraction doesn't work because Vue.js renders the iframe client-side. Must use MCP Playwright to navigate and wait for rendering.

2. **MCP browser context destruction**: If a Vimeo video auto-redirects (e.g., "open in app" dialog), it can destroy the JavaScript execution context. Navigate to a different page first, then retry.

3. **Teaching link title attributes**: Our initial extraction lost `title="Series X, image Y"` from teaching links. These are critical for mapping MongoDB ObjectIds to series/instance indices.

4. **History vs Diagnosis videos are DIFFERENT**: For the same case, the history page and diagnosis page show different Vimeo videos. History = case presentation, Diagnosis = answer walkthrough.

5. **Only ct-abdomenpelvis has history page videos**: brain-mri and liver-mri use "Self-Driven" mode with no video on the history page.

6. **DICOM file URLs**: Instance URLs point to `https://orthanc.navigatingradiology.com/...`. These are proxied through our API at `/api/dicom/[...path]` to avoid CORS issues.

7. **imgix URLs in teaching HTML**: Originally pointed to `https://navigatingrad.imgix.net/...`. We downloaded these locally to `public/images/teaching/` and updated the HTML references.

8. **Supabase env var naming**: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`) — this is the newer naming convention.
