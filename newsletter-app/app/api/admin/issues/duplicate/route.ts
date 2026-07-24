import { NextResponse } from "next/server";

import { getAdminUser, requireAdminApi } from "@/lib/auth";
import { fromDbRow, toDbRow } from "@/lib/issue-mapper";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { id?: string };
  const db = createAdminClient();
  let query = db.from("newsletter_issues").select("*");
  query = body.id ? query.eq("id", body.id) : query.order("created_at", { ascending: false }).limit(1);
  const { data: rows, error } = await query;
  const source = Array.isArray(rows) ? rows[0] : rows;
  if (error || !source) return NextResponse.json({ error: "No previous issue was found." }, { status: 404 });

  const issue = fromDbRow(source as Record<string, unknown>);
  const user = await getAdminUser();
  const duplicated = {
    ...issue,
    title: `Copy of ${issue.title}`,
    issue_date: "",
    scheduled_for: "",
    homepage_publish_at: "",
    roundup_status: "draft" as const,
    roundup_items: issue.roundup_items.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      display_order: index + 1,
    })),
  };
  const { data, error: insertError } = await db.from("newsletter_issues")
    .insert({ ...toDbRow(duplicated), status: "draft", created_by: user?.id })
    .select("id").single();
  return insertError ? NextResponse.json({ error: insertError.message }, { status: 500 }) : NextResponse.json(data, { status: 201 });
}
