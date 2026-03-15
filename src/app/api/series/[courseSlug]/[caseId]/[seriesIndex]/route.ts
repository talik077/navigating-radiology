import { NextRequest, NextResponse } from "next/server";
import { getCaseData } from "@/lib/data";

/**
 * Returns instance URLs for a specific series.
 * This avoids sending all instance data via page props (which bloats SSR).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string; caseId: string; seriesIndex: string }> }
) {
  const { courseSlug, caseId, seriesIndex } = await params;
  const idx = parseInt(seriesIndex, 10);

  const caseData = getCaseData(courseSlug, caseId);
  if (!caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const series = caseData.study.series[idx];
  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  return NextResponse.json({
    urls: series.instances.map((inst) => inst.url),
    window: series.window || null,
    annotations: series.instances
      .map((inst, i) => (inst.annotations ? { index: i, data: inst.annotations } : null))
      .filter(Boolean),
  }, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
