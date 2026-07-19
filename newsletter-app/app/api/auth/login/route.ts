import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (username !== config.adminUsername) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  const email = config.adminEmail;
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || data.user?.email?.toLowerCase() !== config.adminEmail) {
    if (data.session) await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }
  return response;
}
