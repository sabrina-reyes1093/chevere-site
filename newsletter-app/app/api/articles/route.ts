import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { loadPublishedArticles } from "@/lib/featured-reads";

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const articles = await loadPublishedArticles();
    return NextResponse.json(articles.map((article) => ({
      title: article.title,
      preview: article.excerpt,
      url: article.url,
      image: article.image_url,
    })));
  } catch {
    return NextResponse.json({ error: "Unable to load published articles." }, { status: 502 });
  }
}
