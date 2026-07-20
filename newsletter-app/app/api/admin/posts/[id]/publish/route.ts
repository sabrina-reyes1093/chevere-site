import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { postSchema, validateForPublish } from "@/lib/post-schema";
import { publishPost, unpublishPost } from "@/lib/publish-post";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();

  const { data: row, error: readError } = await db.from("blog_posts").select("*").eq("id", id).single();
  if (readError || !row) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const parsed = postSchema.safeParse(row);
  if (!parsed.success) return NextResponse.json({ error: "Review the post fields before publishing." }, { status: 400 });

  const incomplete = validateForPublish(parsed.data);
  if (incomplete) return NextResponse.json({ error: incomplete }, { status: 400 });

  let result;
  try { result = await publishPost(parsed.data); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Publishing failed." }, { status: 500 }); }

  const { error } = await db.from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    postFile: result.postFile,
    cardAction: result.cardAction,
    message: `Wrote ${result.postFile} and ${result.cardAction} its card in blog.html. Commit and push to put it live.`,
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: row } = await db.from("blog_posts").select("slug").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  try { await unpublishPost(row.slug); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove the files." }, { status: 500 }); }

  const { error } = await db.from("blog_posts")
    .update({ status: "draft", published_at: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Removed the post file and its card. Commit and push to take it off the live site." });
}
