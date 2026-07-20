import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { config } from "@/lib/config";
import { postSchema, validateForPublish } from "@/lib/post-schema";
import { publishPost, unpublishPost } from "@/lib/publish-post";
import { publishPostToGitHub, unpublishPostFromGitHub } from "@/lib/publish-github";

/** A hosted deployment cannot write files, so a filesystem error there means the
 *  GitHub credentials are missing rather than that something broke. */
function explainWriteFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/EROFS|read-only file system|EACCES|EPERM/i.test(message)) {
    return "This portal is running on a hosted server, which cannot save files. Add GITHUB_TOKEN and GITHUB_REPO to its environment variables so publishing can commit to GitHub instead, or run the portal on your own computer to publish.";
  }
  return message;
}

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

  let message: string;
  try {
    if (config.githubConfigured) {
      const result = await publishPostToGitHub(parsed.data);
      message = `Committed ${result.postFile} and ${result.cardAction} its card in blog.html (${result.commitSha}). The site rebuilds automatically in a couple of minutes.`;
    } else {
      const result = await publishPost(parsed.data);
      message = `Wrote ${result.postFile} and ${result.cardAction} its card in blog.html. Commit and push to put it live.`;
    }
  } catch (error) {
    return NextResponse.json({ error: explainWriteFailure(error) }, { status: 500 });
  }

  const { error } = await db.from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: row } = await db.from("blog_posts").select("slug,title").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  let message: string;
  try {
    if (config.githubConfigured) {
      const result = await unpublishPostFromGitHub(row.slug, row.title);
      message = `Removed the post and its card (${result.commitSha}). The site rebuilds automatically.`;
    } else {
      await unpublishPost(row.slug);
      message = "Removed the post file and its card. Commit and push to take it off the live site.";
    }
  } catch (error) {
    return NextResponse.json({ error: explainWriteFailure(error) }, { status: 500 });
  }

  const { error } = await db.from("blog_posts")
    .update({ status: "draft", published_at: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message });
}
