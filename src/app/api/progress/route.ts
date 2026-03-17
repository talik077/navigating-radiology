import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/progress?courseSlug=brain-mri
 * Returns progress for the authenticated user on a specific course.
 */
export async function GET(request: NextRequest) {
  const courseSlug = request.nextUrl.searchParams.get("courseSlug");
  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_progress")
    .select("case_id, completed, bookmarked")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const progress: Record<string, { completed: boolean; bookmarked: boolean }> = {};
  for (const row of data ?? []) {
    progress[row.case_id] = {
      completed: row.completed,
      bookmarked: row.bookmarked,
    };
  }

  return NextResponse.json(progress);
}

/**
 * POST /api/progress
 * Body: { courseSlug, caseId, completed?, bookmarked? }
 * Upserts progress for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseSlug, caseId, completed, bookmarked } = body as {
    courseSlug: string;
    caseId: string;
    completed?: boolean;
    bookmarked?: boolean;
  };

  if (!courseSlug || !caseId) {
    return NextResponse.json(
      { error: "courseSlug and caseId required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    user_id: user.id,
    course_slug: courseSlug,
    case_id: caseId,
    updated_at: new Date().toISOString(),
  };
  if (completed !== undefined) updates.completed = completed;
  if (bookmarked !== undefined) updates.bookmarked = bookmarked;

  const { error } = await supabase.from("user_progress").upsert(updates, {
    onConflict: "user_id,course_slug,case_id",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/progress?courseSlug=brain-mri
 * Clears all progress for the authenticated user on a specific course.
 */
export async function DELETE(request: NextRequest) {
  const courseSlug = request.nextUrl.searchParams.get("courseSlug");
  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
