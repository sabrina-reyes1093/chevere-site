import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyUnsubscribeToken } from "@/lib/tokens";

async function unsubscribe(token: string | null) {
  if (!token) return false;
  const verified = await verifyUnsubscribeToken(token);
  if (!verified) return false;
  const now = new Date().toISOString();
  const db = createAdminClient();
  const { error } = await db.from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now }).eq("id", verified.subscriberId);
  if (!error && verified.issueId) await db.from("newsletter_deliveries")
    .update({ unsubscribed_at: now, updated_at: now }).eq("issue_id", verified.issueId).eq("subscriber_id", verified.subscriberId);
  return !error;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const valid = token && await verifyUnsubscribeToken(token);
  if (!valid) return new NextResponse("This unsubscribe link is invalid.", { status: 400 });
  return new NextResponse(`<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4efe7;color:#3d3830;text-align:center;padding:80px 20px"><h1 style="font-family:Georgia,serif">Unsubscribe</h1><p>You’ll stop receiving Chévere Weekly immediately.</p><form method="post"><input type="hidden" name="token" value="${token}"><button style="padding:14px 24px;background:#6b4a36;color:white;border:0;border-radius:8px">Unsubscribe me</button></form></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const token = contentType.includes("application/json")
    ? (await request.json().catch(() => ({}))).token
    : (await request.formData()).get("token")?.toString() || request.nextUrl.searchParams.get("token");
  const ok = await unsubscribe(token || request.nextUrl.searchParams.get("token"));
  if (request.headers.get("list-unsubscribe") === "One-Click") return new NextResponse(null, { status: ok ? 200 : 400 });
  return new NextResponse(`<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4efe7;color:#3d3830;text-align:center;padding:80px 20px"><h1 style="font-family:Georgia,serif">${ok ? "You’re unsubscribed" : "We couldn’t unsubscribe you"}</h1><p>${ok ? "Your preferences were updated immediately." : "Please try the link again."}</p></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
