import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { postSchema } from "@/lib/post-schema";

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminClient().from("blog_posts")
    .select("*").order("published_on", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the post fields.", details: parsed.error.flatten() }, { status: 400 });
  const user = await getAdminUser();
  const { data, error } = await createAdminClient().from("blog_posts")
    .insert({ ...parsed.data, status: "draft", created_by: user?.id }).select("*").single();
  if (error) {
    const message = error.code === "23505" ? "A post already uses that web address." : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
