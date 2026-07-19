import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase-admin";

type EmailEvent = {
  type: string;
  created_at: string;
  data: { email_id?: string };
};

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const webhookId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!webhookId || !timestamp || !signature) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });

  let event: EmailEvent;
  try {
    event = new Resend(config.resendKey).webhooks.verify({
      payload,
      headers: { id: webhookId, timestamp, signature },
      webhookSecret: config.resendWebhookSecret,
    }) as EmailEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const providerId = event.data.email_id || null;
  const db = createAdminClient();
  const { error: eventError } = await db.from("newsletter_webhook_events").insert({
    webhook_id: webhookId,
    provider_id: providerId,
    event_type: event.type,
    occurred_at: event.created_at,
    payload: event,
  });
  if (eventError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Unable to store webhook event." }, { status: 500 });
  if (!providerId || !event.type.startsWith("email.")) return NextResponse.json({ ok: true });

  const { data: delivery } = await db.from("newsletter_deliveries").select("id,subscriber_id").eq("provider_id", providerId).maybeSingle();
  if (!delivery) return NextResponse.json({ ok: true, unmatched: true });

  const occurredAt = event.created_at;
  const timestampField: Record<string, string> = {
    "email.delivered": "delivered_at",
    "email.opened": "opened_at",
    "email.clicked": "clicked_at",
    "email.bounced": "bounced_at",
    "email.complained": "complained_at",
  };
  const field = timestampField[event.type];
  if (field) await db.from("newsletter_deliveries").update({ [field]: occurredAt, updated_at: new Date().toISOString() }).eq("id", delivery.id).is(field, null);
  if (["email.failed", "email.bounced", "email.suppressed"].includes(event.type)) await db.from("newsletter_deliveries").update({ status: "failed", last_error: event.type, updated_at: new Date().toISOString() }).eq("id", delivery.id);
  if (event.type === "email.complained") await db.from("newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: occurredAt, updated_at: new Date().toISOString() }).eq("id", delivery.subscriber_id);

  return NextResponse.json({ ok: true });
}
