import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase-admin";
import { isFridaySendWindow } from "@/lib/schedule";
import { sendIssue } from "@/lib/send-issue";
import type { Issue } from "@/lib/types";

export const maxDuration = 300;

async function recordSkip(reason: string) {
  await createAdminClient().from("newsletter_send_attempts").insert({
    result: "skipped", reason, finished_at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${config.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!config.cronEnabled) {
    await recordSkip("Live newsletter scheduling is disabled by NEWSLETTER_CRON_ENABLED.");
    return NextResponse.json({ skipped: true, reason: "Schedule disabled" });
  }
  const now = new Date();
  if (!isFridaySendWindow(now)) {
    await recordSkip("Invocation was outside the Friday 8:30–10:30 America/Chicago send and retry window.");
    return NextResponse.json({ skipped: true, reason: "Outside send window" });
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("claim_newsletter_issue", { p_now: now.toISOString() });
  if (error) return NextResponse.json({ error: "Unable to claim issue." }, { status: 500 });
  const issue = data?.[0] as Issue | undefined;
  if (!issue) {
    await recordSkip("No approved, scheduled, unsent issue was eligible.");
    return NextResponse.json({ skipped: true, reason: "No eligible issue" });
  }
  try {
    return NextResponse.json({ issueId: issue.id, ...(await sendIssue(issue)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retry = issue.attempt_count < 3;
    await db.from("newsletter_issues").update(retry ? {
      status: "scheduled", last_error: message, next_retry_at: new Date(now.getTime() + 45 * 60_000).toISOString(), updated_at: new Date().toISOString(),
    } : {
      status: "failed", last_error: message, next_retry_at: null, updated_at: new Date().toISOString(),
    }).eq("id", issue.id).eq("status", "sending");
    await db.from("newsletter_send_attempts").insert({ issue_id: issue.id, attempt_number: issue.attempt_count, result: retry ? "retry_scheduled" : "failed", error: message, finished_at: new Date().toISOString() });
    return NextResponse.json({ error: retry ? "Temporary send failure recorded for retry." : "Send failed after the maximum attempts." }, { status: 503 });
  }
}
