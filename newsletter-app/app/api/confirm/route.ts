import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { config } from "@/lib/config";
import { hashToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(`${config.siteUrl}/?subscription=invalid`);
  const hash = await hashToken(token);
  const now = new Date().toISOString();
  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  const { data: pending } = await db.from("newsletter_subscribers").select("id")
    .eq("confirmation_token_hash", hash).eq("status", "pending").gte("confirmation_sent_at", cutoff).maybeSingle();
  if (!pending) return NextResponse.redirect(`${config.siteUrl}/?subscription=invalid`);
  const { data, error } = await db.from("newsletter_subscribers")
    .update({ status: "active", confirmed_at: now, confirmation_token_hash: null, updated_at: now })
    .eq("id", pending.id).eq("status", "pending").select("id").maybeSingle();
  return NextResponse.redirect(`${config.siteUrl}/?subscription=${!error && data ? "confirmed" : "invalid"}`);
}
