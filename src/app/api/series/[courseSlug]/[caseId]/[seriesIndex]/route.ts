import { NextRequest, NextResponse } from "next/server";
import { getSeriesData } from "@/lib/db/queries";

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

  const data = await getSeriesData(courseSlug, caseId, idx);
  if (!data) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
