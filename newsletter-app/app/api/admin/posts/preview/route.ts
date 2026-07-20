import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { config } from "@/lib/config";
import { postSchema } from "@/lib/post-schema";
import { renderPostPage } from "@/lib/post-template";

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Preview tolerates an unfinished slug so drafts can be previewed early.
  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse({ ...body, slug: body?.slug || "preview" });
  if (!parsed.success) return NextResponse.json({ error: "Review the post fields." }, { status: 400 });

  // The generated page uses ../ paths that only resolve once the file sits in
  // posts/. Point them at the live site so the preview renders with real CSS.
  const html = renderPostPage(parsed.data)
    .replaceAll('href="../', `href="${config.siteUrl}/`)
    .replaceAll('src="../', `src="${config.siteUrl}/`);

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
