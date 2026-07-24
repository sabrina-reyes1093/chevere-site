import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { issueSchema } from "@/lib/issue-schema";
import { toDbRow } from "@/lib/issue-mapper";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = issueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the issue fields.", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: current } = await db.from("newsletter_issues").select("status,roundup_status,homepage_publish_at").eq("id", id).single();
  if (!current || current.status === "sent" || current.status === "sending") return NextResponse.json({ error: "A sent or sending issue cannot be edited." }, { status: 409 });
  const update = toDbRow(parsed.data);
  const roundupIsLive = current.roundup_status === "published" ||
    (current.roundup_status === "scheduled" && current.homepage_publish_at && new Date(current.homepage_publish_at) <= new Date());
  if (roundupIsLive) {
    delete update.roundup_items;
    delete update.recommendations;
    delete update.roundup_status;
    delete update.homepage_publish_at;
  }
  const { data, error } = await db.from("newsletter_issues").update({ ...update, status: "draft", approved_at: null, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: current } = await db.from("newsletter_issues").select("status").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  if (current.status === "sent" || current.status === "sending") return NextResponse.json({ error: "Cannot delete a sent or sending issue." }, { status: 409 });
  const { error } = await db.from("newsletter_issues").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
