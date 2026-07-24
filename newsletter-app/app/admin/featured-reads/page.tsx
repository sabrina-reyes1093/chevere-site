import { AdminShell } from "@/components/admin-shell";
import { FeaturedReadsEditor } from "@/components/featured-reads-editor";
import { requireAdminPage } from "@/lib/auth";
import { loadFeaturedReads, loadPublishedArticles } from "@/lib/featured-reads";

export const dynamic = "force-dynamic";

export default async function FeaturedReadsPage() {
  await requireAdminPage();
  const [articles, initialItems] = await Promise.all([
    loadPublishedArticles(),
    loadFeaturedReads(),
  ]);

  return (
    <AdminShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Homepage curation</p>
          <h1>Featured Reads</h1>
          <p>Select, reorder, preview, and publish the three evergreen stories shown on the homepage.</p>
        </div>
      </div>
      <FeaturedReadsEditor articles={articles} initialItems={initialItems} />
    </AdminShell>
  );
}
