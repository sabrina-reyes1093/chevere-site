import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { issueSchema, validateForApproval } from "@/lib/issue-schema";
import { nextFridayAtChicagoTime } from "@/lib/schedule";
import { config } from "@/lib/config";
import { fromDbRow } from "@/lib/issue-mapper";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = createAdminClient();
  const { data: row, error } = await db.from("newsletter_issues").select("*").eq("id", id).single();
  if (error || !row) return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  if (row.status === "sent" || row.sent_at) return NextResponse.json({ error: "This issue was already sent." }, { status: 409 });
  const parsed = issueSchema.safeParse(fromDbRow(row));
  if (!parsed.success) return NextResponse.json({ error: "The issue has invalid fields." }, { status: 400 });
  const incomplete = validateForApproval(parsed.data);
  if (incomplete) return NextResponse.json({ error: incomplete }, { status: 400 });
  const scheduled = nextFridayAtChicagoTime(new Date(), config.sendTime);
  const now = new Date().toISOString();
  const { data, error: updateError } = await db.from("newsletter_issues").update({
    status: "scheduled", approved_at: now, scheduled_for: scheduled.toISOString(), next_retry_at: null, last_error: null, updated_at: now,
  }).eq("id", id).neq("status", "sent").select("*").single();
  return updateError ? NextResponse.json({ error: updateError.message }, { status: 500 }) : NextResponse.json(data);
}
