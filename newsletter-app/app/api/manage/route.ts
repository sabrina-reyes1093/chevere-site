import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyUnsubscribeToken } from "@/lib/tokens";
import { config } from "@/lib/config";

function page(content: string, status = 200) {
  return new NextResponse(`<!doctype html><html><meta name="viewport" content="width=device-width"><body style="margin:0;background:#f4efe7;color:#3d3830;font-family:Arial,sans-serif;padding:32px 18px"><main style="max-width:560px;margin:auto;background:#fffdf8;border:1px solid #ded3c7;padding:40px;border-radius:16px"><h1 style="font-family:Georgia,serif">Manage your Chévere subscription</h1>${content}<p style="margin-top:30px"><a href="${config.siteUrl}" style="color:#6b4a36">Return to Chévere</a></p></main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const verified = token && await verifyUnsubscribeToken(token);
  if (!verified) return page("<p>This subscription-management link is invalid.</p>", 400);
  const { data } = await createAdminClient().from("newsletter_subscribers").select("status").eq("id", verified.subscriberId).maybeSingle();
  if (!data) return page("<p>This subscription could not be found.</p>", 404);
  if (data.status === "unsubscribed") return page("<p>You are currently unsubscribed.</p><p>You can rejoin anytime from the signup form on the Chévere website.</p>");
  return page(`<p>You are subscribed to <strong>Chévere Weekly</strong>.</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="token" value="${token}"><button style="padding:13px 20px;background:#6b4a36;color:#fff;border:0;border-radius:8px;font-weight:bold">Unsubscribe</button></form>`);
}
