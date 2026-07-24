import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { renderNewsletter } from "@/lib/email-template";
import { config } from "@/lib/config";
import type { IssueInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const issue: IssueInput = {
      note_from_sabrina: body.note_from_sabrina || "",
      title: body.title || "Untitled issue",
      subject: body.subject || "Chévere Weekly",
      preview_text: body.preview_text || "",
      issue_date: body.issue_date || "",
      scheduled_for: body.scheduled_for || "",
      homepage_publish_at: body.homepage_publish_at || "",
      roundup_status: body.roundup_status || "draft",
      featured_title: body.featured_title || "",
      featured_preview: body.featured_preview || "",
      featured_url: body.featured_url || "",
      featured_image_url: body.featured_image_url || "",
      roundup_items: Array.isArray(body.roundup_items) ? body.roundup_items.slice(0, 3).map((item: Record<string, unknown>, index: number) => ({
        id: typeof item?.id === "string" ? item.id : `preview-card-${index + 1}`,
        category: typeof item?.category === "string" ? item.category : "",
        title: typeof item?.title === "string" ? item.title : "",
        text: typeof item?.text === "string" ? item.text : "",
        url: typeof item?.url === "string" ? item.url : "",
        image_url: typeof item?.image_url === "string" ? item.image_url : "",
        image_alt: typeof item?.image_alt === "string" ? item.image_alt : "",
        link_type: item?.link_type === "external" ? "external" as const : "internal" as const,
        cta_label: typeof item?.cta_label === "string" ? item.cta_label : "Read More",
        display_order: index + 1,
      })) : [],
      closing_note: body.closing_note || "",
      signoff: body.signoff || "Until next week,\nStay CHÉVERE",
    };
    return new NextResponse(renderNewsletter(issue, `${config.siteUrl}/`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Preview error: ${msg}` }, { status: 500 });
  }
}
