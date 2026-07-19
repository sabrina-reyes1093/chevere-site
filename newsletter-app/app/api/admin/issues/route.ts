import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { issueSchema } from "@/lib/issue-schema";

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = issueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the issue fields.", details: parsed.error.flatten() }, { status: 400 });
  const user = await getAdminUser();
  const { data, error } = await createAdminClient().from("newsletter_issues")
    .insert({ ...parsed.data, status: "draft", created_by: user?.id }).select("*").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data, { status: 201 });
}
