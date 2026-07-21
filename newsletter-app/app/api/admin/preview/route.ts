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
      title: body.title || "Untitled issue",
      subject: body.subject || "The Edit, Delivered",
      preview_text: body.preview_text || "",
      scheduled_for: body.scheduled_for || "",
      featured_title: body.featured_title || "",
      featured_preview: body.featured_preview || "",
      featured_url: body.featured_url || "",
      featured_image_url: body.featured_image_url || "",
      roundup_items: Array.isArray(body.roundup_items) ? body.roundup_items.map((item: any) => ({ category: item?.category || "", title: item?.title || "", text: item?.text || "", url: item?.url || "", image_url: item?.image_url || "" })) : [],
      closing_note: body.closing_note || "",
      signoff: body.signoff || "Until next week,\nSabrina",
    };
    return new NextResponse(renderNewsletter(issue, `${config.siteUrl}/`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Preview error: ${msg}` }, { status: 500 });
  }
}
