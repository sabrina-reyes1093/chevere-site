import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { issueSchema } from "@/lib/issue-schema";
import { renderNewsletter } from "@/lib/email-template";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = issueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the issue fields." }, { status: 400 });
  return new NextResponse(renderNewsletter(parsed.data, `${config.siteUrl}/`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
