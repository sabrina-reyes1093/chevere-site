import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { config } from "@/lib/config";
import { renderNewsletter } from "@/lib/email-template";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { data: issue, error } = await createAdminClient().from("newsletter_issues").select("*").eq("id", id).single();
  if (error || !issue) return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  const result = await new Resend(config.resendKey).emails.send({
    from: config.from, to: config.testEmail, replyTo: config.replyTo,
    subject: `[TEST] ${issue.subject}`, html: renderNewsletter(issue, `${config.siteUrl}/`),
  });
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 502 }) : NextResponse.json({ ok: true, providerId: result.data?.id });
}
