"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageField } from "@/components/image-field";
import { CATEGORIES, slugify, type Post, type PostInput } from "@/lib/post-schema";

const today = () => new Date().toISOString().slice(0, 10);

const empty: PostInput = {
  slug: "", title: "", category: "culture", dek: "", body: "",
  cover_image_url: "", hero_image_url: "", signoff: "Until next week — stay *chévere*",
  published_on: today(),
};

export function PostEditor({ initial }: { initial?: Post }) {
  const router = useRouter();
  const [post, setPost] = useState<PostInput>(initial ? { ...initial } : empty);
  const [id, setId] = useState(initial?.id || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  const field = (name: keyof PostInput, value: string) => setPost((current) => ({ ...current, [name]: value }));

  function changeTitle(value: string) {
    setPost((current) => ({ ...current, title: value, slug: slugTouched ? current.slug : slugify(value) }));
  }

  async function request(url: string, options: RequestInit) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(url, options);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Request failed.");
      return body;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed."); throw error; }
    finally { setBusy(false); }
  }

  async function save() {
    const data = await request(id ? `/api/admin/posts/${id}` : "/api/admin/posts", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    setId(data.id); setStatus(data.status); setMessage("Draft saved.");
    if (!id) router.replace(`/admin/posts/${data.id}`);
  }

  async function showPreview() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/posts/preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Preview failed.");
      setPreview(await response.text());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Preview failed."); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!id) return setMessage("Save the draft before publishing.");
    await save();
    const data = await request(`/api/admin/posts/${id}/publish`, { method: "POST" });
    setStatus("published"); setMessage(data.message);
    router.refresh();
  }

  async function unpublish() {
    if (!id) return;
    const data = await request(`/api/admin/posts/${id}/publish`, { method: "DELETE" });
    setStatus("draft"); setMessage(data.message);
    router.refresh();
  }

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">The Chévere Edit</p>
        <h1>{id ? post.title || "Untitled post" : "New blog post"}</h1>
        <p><span className={`status ${status === "published" ? "sent" : status}`}>{status}</span>{post.slug && ` /posts/${post.slug}.html`}</p>
      </div>
      <a href="/admin/posts" className="secondary link-button">Back to posts</a>
    </div>
    {message && <p className={`message ${/failed|error|unable|review|before|already/i.test(message) ? "error" : "success"}`}>{message}</p>}

    <div className="editor-layout">
      <form className="editor stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy}>
          <legend>Post details</legend>
          <label>Title<input value={post.title} onChange={(e) => changeTitle(e.target.value)} required /></label>
          <div className="two-col">
            <label>Category
              <select value={post.category} onChange={(e) => field("category", e.target.value)}>
                {CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
              </select>
            </label>
            <label>Date<input type="date" value={post.published_on} onChange={(e) => field("published_on", e.target.value)} /></label>
          </div>
          <label>Web address
            <input value={post.slug} onChange={(e) => { setSlugTouched(true); field("slug", e.target.value); }} required />
            <small className="field-hint">Lowercase words with hyphens. The page will live at /posts/{post.slug || "your-post"}.html</small>
          </label>
          <label>Short description<textarea rows={3} value={post.dek} onChange={(e) => field("dek", e.target.value)} />
            <small className="field-hint">Shown on the blog card and used as the page description.</small>
          </label>
        </fieldset>

        <fieldset disabled={busy}>
          <legend>Images</legend>
          <ImageField label="Cover image (blog card)" value={post.cover_image_url} onChange={(url) => field("cover_image_url", url)} disabled={busy} />
          <ImageField label="Hero image (top of the post, optional)" value={post.hero_image_url} onChange={(url) => field("hero_image_url", url)} disabled={busy} />
        </fieldset>

        <fieldset disabled={busy}>
          <legend>Body</legend>
          <label>Post content<textarea className="body-input" rows={22} value={post.body} onChange={(e) => field("body", e.target.value)} /></label>
          <details className="formatting-help">
            <summary>Formatting cheatsheet</summary>
            <ul>
              <li><code>## Heading</code> — a section heading</li>
              <li><code>**Bold text**</code> — a bold subheading</li>
              <li><code>*italic*</code> — italics</li>
              <li><code>[link text](https://example.com)</code> — a link</li>
              <li><code>![description](image-url)</code> — an image on its own line</li>
              <li>Leave a blank line between paragraphs.</li>
            </ul>
          </details>
          <label>Sign-off (optional)<input value={post.signoff} onChange={(e) => field("signoff", e.target.value)} /></label>
        </fieldset>

        <div className="action-bar">
          <button className="primary" disabled={busy}>Save draft</button>
          <button type="button" className="secondary" onClick={showPreview} disabled={busy}>Preview</button>
          <button type="button" className="approve" onClick={publish} disabled={busy || !id}>
            {status === "published" ? "Re-publish" : "Publish"}
          </button>
          {status === "published" && <button type="button" className="secondary" onClick={unpublish} disabled={busy}>Unpublish</button>}
        </div>
      </form>

      <aside className="preview-panel">
        <div className="preview-toolbar"><strong>Page preview</strong></div>
        {preview
          ? <iframe title="Post preview" srcDoc={preview} className="desktop" />
          : <div className="preview-empty">Choose Preview to see the finished page.</div>}
      </aside>
    </div>
  </>;
}
