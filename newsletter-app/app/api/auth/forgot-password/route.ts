import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();

  if (email !== config.adminEmail) {
    return NextResponse.redirect(new URL("/admin/forgot-password?sent=ok", request.url), 303);
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${config.newsletterUrl}/admin/reset-password`,
  });

  return NextResponse.redirect(
    new URL(`/admin/forgot-password?sent=${error ? "error" : "ok"}`, request.url),
    303,
  );
}