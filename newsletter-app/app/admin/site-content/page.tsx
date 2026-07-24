import { AdminShell } from "@/components/admin-shell";
import { SiteContentEditor } from "@/components/site-content-editor";
import { requireAdminPage } from "@/lib/auth";
import { loadSiteContent } from "@/lib/site-content";

export default async function SiteContentPage() {
  await requireAdminPage();
  const content = await loadSiteContent();

  return (
    <AdminShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Homepage</p>
          <h1>Site content</h1>
          <p>Manage The Summer Guide shown beneath the homepage welcome.</p>
        </div>
      </div>
      <SiteContentEditor initialContent={content} />
    </AdminShell>
  );
}
