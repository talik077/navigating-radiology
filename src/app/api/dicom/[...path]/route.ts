import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_HOST = "navigating-radiology-app.s3.ca-central-1.amazonaws.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const encodedUrl = path.join("/");
  const s3Url = decodeURIComponent(encodedUrl);

  // Security: only allow fetching from the known S3 bucket
  try {
    const url = new URL(s3Url);
    if (url.hostname !== ALLOWED_HOST) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const resp = await fetch(s3Url);
    if (!resp.ok) {
      return new NextResponse(`S3 error: ${resp.status}`, { status: resp.status });
    }

    const body = resp.body;
    if (!body) {
      return new NextResponse("Empty response", { status: 502 });
    }

    // Stream the response through - the browser/cornerstone will handle decompression
    // S3 serves .dcm.gz files with Content-Encoding: gzip, so fetch auto-decompresses
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/dicom",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse(`Fetch error: ${err}`, { status: 502 });
  }
}
