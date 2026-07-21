import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { IssueEditor } from "@/components/issue-editor";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { fromDbRow } from "@/lib/issue-mapper";

export const dynamic = "force-dynamic";

export default async function EditIssue({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const { data } = await createAdminClient().from("newsletter_issues").select("*").eq("id", id).single();
  if (!data) notFound();
  return <AdminShell><IssueEditor initial={{ ...fromDbRow(data), id: data.id, status: data.status, approved_at: data.approved_at, scheduled_for: data.scheduled_for, sent_at: data.sent_at, recipient_count: data.recipient_count, attempt_count: data.attempt_count, next_retry_at: data.next_retry_at, last_error: data.last_error, created_at: data.created_at, updated_at: data.updated_at }} /></AdminShell>;
}