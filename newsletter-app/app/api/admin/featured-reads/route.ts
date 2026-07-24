import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser, requireAdminApi } from "@/lib/auth";
import { loadFeaturedReads } from "@/lib/featured-reads";
import { createAdminClient } from "@/lib/supabase-admin";

const selectionSchema = z.object({
  post_ids: z.array(z.string().uuid()).length(3),
}).superRefine((value, context) => {
  if (new Set(value.post_ids).size !== 3) {
    context.addIssue({ code: "custom", path: ["post_ids"], message: "Choose three different articles." });
  }
});

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ items: await loadFeaturedReads() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Featured Reads." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = selectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select exactly three different published articles.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  const { data: posts, error: postsError } = await db
    .from("blog_posts")
    .select("id")
    .in("id", parsed.data.post_ids)
    .eq("status", "published");

  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 });
  if ((posts || []).length !== 3) {
    return NextResponse.json({ error: "All three selections must be published articles." }, { status: 400 });
  }

  const user = await getAdminUser();
  const updatedAt = new Date().toISOString();
  const rows = parsed.data.post_ids.map((postId, index) => ({
    display_order: index + 1,
    post_id: postId,
    updated_at: updatedAt,
    updated_by: user?.id || null,
  }));
  const { error } = await db
    .from("homepage_featured_reads")
    .upsert(rows, { onConflict: "display_order" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: await loadFeaturedReads() });
}
