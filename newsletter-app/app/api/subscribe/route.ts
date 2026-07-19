import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { config } from "@/lib/config";
import { corsHeaders } from "@/lib/cors";
import { hashToken, randomToken } from "@/lib/tokens";

const schema = z.object({ email: z.string().trim().email().max(320) });

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers });

  const email = parsed.data.email.toLowerCase();
  const db = createAdminClient();
  const { data: existing, error: lookupError } = await db.from("newsletter_subscribers").select("id,status,confirmation_sent_at").eq("email", email).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 503, headers });
  if (existing?.status === "active") return NextResponse.json({ ok: true, message: "Check your inbox." }, { status: 202, headers });
  if (existing?.status === "pending" && existing.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < 5 * 60_000) {
    return NextResponse.json({ ok: true, message: "Check your inbox to confirm." }, { status: 202, headers });
  }

  const token = randomToken();
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();
  const values = {
    email,
    status: "pending",
    confirmation_token_hash: tokenHash,
    confirmation_sent_at: null,
    confirmed_at: null,
    unsubscribed_at: null,
    updated_at: now,
  };
  const query = existing
    ? db.from("newsletter_subscribers").update(values).eq("id", existing.id).select("id").single()
    : db.from("newsletter_subscribers").insert(values).select("id").single();
  const { error } = await query;
  if (error) return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 503, headers });

  const confirmUrl = `${config.newsletterUrl}/api/confirm?token=${encodeURIComponent(token)}`;
  const { error: emailError } = await new Resend(config.resendKey).emails.send({
    from: config.from,
    to: email,
    replyTo: config.replyTo,
    subject: "Confirm your subscription to The Edit, Delivered",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#3d3830"><h1 style="font-family:Georgia,serif">One last step</h1><p>Confirm that you’d like to receive <strong>The Edit, Delivered</strong> every Friday.</p><p><a href="${confirmUrl}" style="display:inline-block;padding:14px 22px;background:#6b4a36;color:#fff;text-decoration:none;border-radius:8px">Confirm my subscription</a></p><p>If you did not request this, you can ignore this email.</p></div>`,
  });
  if (emailError) return NextResponse.json({ error: "We saved your request but could not send the confirmation email." }, { status: 503, headers });
  await db.from("newsletter_subscribers").update({ confirmation_sent_at: now, updated_at: now }).eq("email", email).eq("status", "pending");
  return NextResponse.json({ ok: true, message: "Check your inbox to confirm." }, { status: 202, headers });
}
