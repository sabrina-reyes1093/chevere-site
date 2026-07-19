import { AdminShell } from "@/components/admin-shell";
import { IssueEditor } from "@/components/issue-editor";
import { requireAdminPage } from "@/lib/auth";

export default async function NewIssue() {
  await requireAdminPage();
  return <AdminShell><IssueEditor /></AdminShell>;
}
