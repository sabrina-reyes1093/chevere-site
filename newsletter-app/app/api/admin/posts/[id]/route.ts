import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { postSchema } from "@/lib/post-schema";
import { unpublishPost } from "@/lib/publish-post";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await createAdminClient().from("blog_posts").select("*").eq("id", id).single();
  return error ? NextResponse.json({ error: error.message }, { status: 404 }) : NextResponse.json(data);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the post fields.", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await createAdminClient().from("blog_posts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) {
    const message = error.code === "23505" ? "A post already uses that web address." : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: post } = await db.from("blog_posts").select("slug,status").eq("id", id).single();
  // Take the published files down first so the site never links to a missing page.
  if (post?.status === "published") {
    try { await unpublishPost(post.slug); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove the published files." }, { status: 500 }); }
  }
  const { error } = await db.from("blog_posts").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
