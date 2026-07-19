import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";
import { config } from "@/lib/config";
import { createUnsubscribeToken } from "@/lib/tokens";
import { renderNewsletter } from "@/lib/email-template";
import type { Issue } from "@/lib/types";

const BATCH_SIZE = 100;

function temporary(error: unknown) {
  const text = String(error).toLowerCase();
  return /429|timeout|temporar|rate|unavailable|5\d\d/.test(text);
}

export async function sendIssue(issue: Issue) {
  const db = createAdminClient();
  const resend = new Resend(config.resendKey);
  const started = new Date().toISOString();
  const { data: attempt } = await db.from("newsletter_send_attempts").insert({
    issue_id: issue.id,
    attempt_number: issue.attempt_count,
    result: "running",
    started_at: started,
  }).select("id").single();

  const { data: subscribers, error: subscriberError } = await db.from("newsletter_subscribers")
    .select("id,email").eq("status", "active").not("confirmed_at", "is", null).order("id");
  if (subscriberError) throw subscriberError;
  if (!subscribers?.length) {
    const reason = "No active, confirmed subscribers.";
    await db.from("newsletter_issues").update({ status: "failed", last_error: reason, updated_at: new Date().toISOString() }).eq("id", issue.id);
    if (attempt) await db.from("newsletter_send_attempts").update({ result: "skipped", reason, finished_at: new Date().toISOString() }).eq("id", attempt.id);
    return { sent: 0, failed: 0, reason };
  }

  const deliveryRows = subscribers.map((subscriber, index) => ({
    issue_id: issue.id,
    subscriber_id: subscriber.id,
    batch_number: Math.floor(index / BATCH_SIZE),
    status: "pending",
  }));
  await db.from("newsletter_deliveries").upsert(deliveryRows, { onConflict: "issue_id,subscriber_id", ignoreDuplicates: true });

  let sent = 0;
  let failed = 0;
  let retryable = true;
  const providerResponses: unknown[] = [];
  for (let offset = 0; offset < subscribers.length; offset += BATCH_SIZE) {
    const batchNumber = Math.floor(offset / BATCH_SIZE);
    const members = subscribers.slice(offset, offset + BATCH_SIZE);
    const memberIds = members.map((member) => member.id);
    const { data: existing } = await db.from("newsletter_deliveries")
      .select("subscriber_id,status").eq("issue_id", issue.id).in("subscriber_id", memberIds);
    const alreadySent = new Set((existing || []).filter((row) => row.status === "sent").map((row) => row.subscriber_id));
    const pending = members.filter((member) => !alreadySent.has(member.id));
    sent += alreadySent.size;
    if (!pending.length) continue;

    const messages = await Promise.all(pending.map(async (subscriber) => {
      const token = await createUnsubscribeToken(subscriber.id, issue.id);
      const unsubscribeUrl = `${config.newsletterUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
      const manageUrl = `${config.newsletterUrl}/api/manage?token=${encodeURIComponent(token)}`;
      return {
        from: config.from,
        to: subscriber.email,
        replyTo: config.replyTo,
        subject: issue.subject,
        html: renderNewsletter(issue, unsubscribeUrl, manageUrl),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [{ name: "issue_id", value: issue.id.replaceAll("-", "") }],
      };
    }));

    try {
      const { data, error } = await resend.batch.send(messages, {
        idempotencyKey: `issue-${issue.id}-batch-${batchNumber}`,
      });
      if (error) throw error;
      providerResponses.push(data);
      const ids = data?.data || [];
      for (let index = 0; index < pending.length; index += 1) {
        await db.from("newsletter_deliveries").update({
          status: "sent",
          provider_id: ids[index]?.id || null,
          attempt_count: issue.attempt_count,
          last_error: null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("issue_id", issue.id).eq("subscriber_id", pending[index].id);
        sent += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed += pending.length;
      await db.from("newsletter_deliveries").update({
        status: "failed", attempt_count: issue.attempt_count, last_error: message, updated_at: new Date().toISOString(),
      }).eq("issue_id", issue.id).in("subscriber_id", pending.map((item) => item.id));
      if (!temporary(error)) { retryable = false; break; }
    }
  }

  const now = new Date();
  const retry = failed > 0 && retryable && issue.attempt_count < 3;
  await db.from("newsletter_issues").update(retry ? {
    status: "scheduled",
    recipient_count: sent,
    next_retry_at: new Date(now.getTime() + 45 * 60_000).toISOString(),
    last_error: `${failed} deliveries require retry.`,
    updated_at: now.toISOString(),
  } : failed > 0 ? {
    status: "failed", recipient_count: sent, last_error: `${failed} deliveries failed after retries.`, updated_at: now.toISOString(),
  } : {
    status: "sent", recipient_count: sent, sent_at: now.toISOString(), next_retry_at: null, last_error: null, updated_at: now.toISOString(),
  }).eq("id", issue.id).eq("status", "sending");

  if (attempt) await db.from("newsletter_send_attempts").update({
    result: failed ? (retry ? "retry_scheduled" : "failed") : "sent",
    recipient_count: sent,
    provider_response: providerResponses,
    error: failed ? `${failed} deliveries failed.` : null,
    finished_at: now.toISOString(),
  }).eq("id", attempt.id);
  return { sent, failed, retry };
}
