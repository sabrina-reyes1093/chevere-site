import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { PostEditor } from "@/components/post-editor";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const { data } = await createAdminClient().from("blog_posts").select("*").eq("id", id).single();
  if (!data) notFound();
  return <AdminShell><PostEditor initial={data} /></AdminShell>;
}
