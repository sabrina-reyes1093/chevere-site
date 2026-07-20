import { AdminShell } from "@/components/admin-shell";
import { PostEditor } from "@/components/post-editor";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  await requireAdminPage();
  return <AdminShell><PostEditor /></AdminShell>;
}
