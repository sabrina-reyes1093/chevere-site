import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { fromDbRow } from "@/lib/issue-mapper";
import { issueSchema, validateRoundupForPublication } from "@/lib/issue-schema";
import { nextSundayAtChicagoTime } from "@/lib/schedule";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({})) as { action?: string };
  const db = createAdminClient();
  const { data: row, error } = await db.from("newsletter_issues").select("*").eq("id", id).single();
  if (error || !row) return NextResponse.json({ error: "Issue not found." }, { status: 404 });

  if (body.action === "archive") {
    const { data, error: archiveError } = await db.from("newsletter_issues")
      .update({ roundup_status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id).select("*").single();
    return archiveError ? NextResponse.json({ error: archiveError.message }, { status: 500 }) : NextResponse.json(data);
  }

  const parsed = issueSchema.safeParse(fromDbRow(row as Record<string, unknown>));
  if (!parsed.success) return NextResponse.json({ error: "Review the issue fields." }, { status: 400 });
  const validation = validateRoundupForPublication(parsed.data);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  const cards = parsed.data.roundup_items.slice().sort((a, b) => a.display_order - b.display_order);
  if (body.action === "publish") {
    const now = new Date().toISOString();
    const { data, error: publishError } = await db.from("newsletter_issues").update({
      roundup_status: "published",
      homepage_publish_at: now,
      roundup_snapshot: cards,
      updated_at: now,
    }).eq("id", id).select("*").single();
    return publishError ? NextResponse.json({ error: publishError.message }, { status: 500 }) : NextResponse.json(data);
  }

  if (body.action === "schedule") {
    const publishAt = parsed.data.homepage_publish_at
      ? new Date(parsed.data.homepage_publish_at)
      : nextSundayAtChicagoTime(new Date(), "08:00");
    if (!Number.isFinite(publishAt.getTime())) return NextResponse.json({ error: "Choose a valid homepage publication time." }, { status: 400 });
    const { data, error: scheduleError } = await db.from("newsletter_issues").update({
      roundup_status: "scheduled",
      homepage_publish_at: publishAt.toISOString(),
      roundup_snapshot: null,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select("*").single();
    return scheduleError ? NextResponse.json({ error: scheduleError.message }, { status: 500 }) : NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown roundup action." }, { status: 400 });
}
