import { NextResponse } from "next/server";
import { load } from "cheerio";
import { requireAdminApi } from "@/lib/auth";
import { config } from "@/lib/config";

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const response = await fetch(`${config.siteUrl}/blog.html`, { next: { revalidate: 300 } });
  if (!response.ok) return NextResponse.json({ error: "Unable to load published articles." }, { status: 502 });
  const $ = load(await response.text());
  const articles = $(".post-card").map((_, element) => {
    const card = $(element);
    const style = card.find(".thumb").attr("style") || "";
    const image = style.match(/url\(['\"]?([^'\")]+)['\"]?\)/)?.[1] || "";
    return {
      title: card.find("h2").text().trim(),
      preview: card.find(".dek").text().trim(),
      url: new URL(card.attr("href") || "blog.html", `${config.siteUrl}/`).toString(),
      image: image ? new URL(image, `${config.siteUrl}/`).toString() : "",
    };
  }).get();
  return NextResponse.json(articles);
}
