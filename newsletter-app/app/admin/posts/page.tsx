import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { categoryLabel, displayDate } from "@/lib/post-schema";
import { UnpublishPostButton } from "@/components/unpublish-post-button";
import { DeletePostButton } from "@/components/delete-post-button";

export const dynamic = "force-dynamic";

export default async function BlogPosts() {
  await requireAdminPage();
  const { data: posts } = await createAdminClient().from("blog_posts")
    .select("id,title,slug,category,status,published_on,updated_at")
    .order("published_on", { ascending: false });

  return <AdminShell>
    <div className="page-heading">
      <div>
        <p className="eyebrow">The Chévere Edit</p>
        <h1>Blog posts</h1>
        <p>Publishing writes the page into your site folder. Commit and push to put it live.</p>
      </div>
      <Link href="/admin/posts/new" className="primary link-button">Write a post</Link>
    </div>
    <section className="panel">
      <div className="table-wrap"><table>
        <thead><tr><th>Post</th><th>Category</th><th>Status</th><th>Date</th><th>Last edited</th><th>Actions</th></tr></thead>
        <tbody>
          {(posts || []).map((post) => <tr key={post.id}>
            <td><Link href={`/admin/posts/${post.id}`}><strong>{post.title || "Untitled post"}</strong></Link><small>/posts/{post.slug}.html</small></td>
            <td>{categoryLabel(post.category)}</td>
            <td><span className={`status ${post.status === "published" ? "sent" : post.status}`}>{post.status}</span></td>
            <td>{displayDate(post.published_on)}</td>
            <td>{new Date(post.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
            <td style={{ whiteSpace: "nowrap" }}>
              <Link href={`/admin/posts/${post.id}`} className="secondary" style={{ fontSize: 13, padding: "6px 14px", minHeight: 32, display: "inline-flex", marginRight: 6 }}>Edit</Link>
              {post.status === "published" && <UnpublishPostButton id={post.id} />}
              <DeletePostButton id={post.id} published={post.status === "published"} />
            </td>
          </tr>)}
          {!posts?.length && <tr><td colSpan={6}>No posts yet. Write the first one.</td></tr>}
        </tbody>
      </table></div>
    </section>
  </AdminShell>;
}
