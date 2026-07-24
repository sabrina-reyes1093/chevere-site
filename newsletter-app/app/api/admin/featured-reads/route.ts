import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser, requireAdminApi } from "@/lib/auth";
import { loadFeaturedReads, loadPublishedArticles } from "@/lib/featured-reads";
import { createAdminClient } from "@/lib/supabase-admin";

const selectionSchema = z.object({
  post_ids: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).length(3),
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

  const publishedArticles = await loadPublishedArticles();
  if (parsed.data.post_ids.some((slug) => !publishedArticles.some((article) => article.slug === slug))) {
    return NextResponse.json({ error: "All three selections must be published articles." }, { status: 400 });
  }

  const db = createAdminClient();
  const user = await getAdminUser();
  const updatedAt = new Date().toISOString();
  const rows = parsed.data.post_ids.map((postSlug, index) => ({
    display_order: index + 1,
    post_slug: postSlug,
    updated_at: updatedAt,
    updated_by: user?.id || null,
  }));
  const { error } = await db
    .from("homepage_featured_reads")
    .upsert(rows, { onConflict: "display_order" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: await loadFeaturedReads() });
}
