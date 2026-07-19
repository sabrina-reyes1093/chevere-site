import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { corsHeaders } from "@/lib/cors";

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
  const { data: existing, error: lookupError } = await db.from("newsletter_subscribers").select("id,status").eq("email", email).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 503, headers });
  if (existing?.status === "active") return NextResponse.json({ ok: true, message: "You're already subscribed." }, { headers });

  const now = new Date().toISOString();
  const values = {
    email,
    status: "active",
    confirmation_token_hash: null,
    confirmation_sent_at: null,
    confirmed_at: now,
    unsubscribed_at: null,
    updated_at: now,
  };
  const query = existing
    ? db.from("newsletter_subscribers").update(values).eq("id", existing.id).select("id").single()
    : db.from("newsletter_subscribers").insert(values).select("id").single();
  const { error } = await query;
  if (error) return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 503, headers });

  return NextResponse.json({ ok: true, message: "You're subscribed." }, { headers });
}
