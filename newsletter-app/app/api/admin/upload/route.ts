import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

const BUCKET = "newsletter-images";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach an image to upload." }, { status: 400 });

  const extension = EXTENSIONS[file.type];
  if (!extension) return NextResponse.json({ error: "Use a PNG, JPEG, GIF, or WebP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });

  const supabase = createAdminClient();
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
