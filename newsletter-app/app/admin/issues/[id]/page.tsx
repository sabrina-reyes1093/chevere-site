import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { IssueEditor } from "@/components/issue-editor";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditIssue({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const { data } = await createAdminClient().from("newsletter_issues").select("*").eq("id", id).single();
  if (!data) notFound();
  return <AdminShell><IssueEditor initial={data} /></AdminShell>;
}
