"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, IssueInput, RoundupItem } from "@/lib/types";
import { ImageField } from "@/components/image-field";

const DEFAULT_CATS = new Set(["Watching", "Listening", "Reading", "Favorite Find"]);

const defaultRoundup: RoundupItem[] = [
  { category: "Watching", title: "", text: "", url: "", image_url: "" },
  { category: "Listening", title: "", text: "", url: "", image_url: "" },
  { category: "Reading", title: "", text: "", url: "", image_url: "" },
  { category: "Favorite Find", title: "", text: "", url: "", image_url: "" },
];

function isDefault(cat: string) { return DEFAULT_CATS.has(cat); }

const empty: IssueInput = {
  note_from_sabrina: "", title: "", subject: "", preview_text: "", scheduled_for: "",
  featured_title: "", featured_preview: "", featured_url: "", featured_image_url: "",
  roundup_items: defaultRoundup,
  closing_note: "", signoff: "Until next week,\nStay CHÉVERE",
};

type Article = { title: string; preview: string; url: string; image: string };

export function IssueEditor({ initial }: { initial?: Issue }) {
  const router = useRouter();
  const [issue, setIssue] = useState<IssueInput>(initial ? { ...initial, roundup_items: initial.roundup_items?.length ? initial.roundup_items : defaultRoundup, signoff: initial.signoff || "Until next week,\nStay CHÉVERE" } : empty);
  const [id, setId] = useState(initial?.id || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [articles, setArticles] = useState<Article[]>([]);
  const [approved, setApproved] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const idRef = useRef(id);
  const issueRef = useRef(issue);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { idRef.current = id; }, [id]);
  useEffect(() => { issueRef.current = issue; }, [issue]);

  const markDirty = () => { setDirty(true); dirtyRef.current = true; };

  useEffect(() => { fetch("/api/articles").then((r) => r.ok ? r.json() : []).then(setArticles).catch(() => setArticles([])); }, []);

  const field = (name: keyof IssueInput, value: string) => { setIssue((current) => ({ ...current, [name]: value })); markDirty(); };

  const updateRoundupItem = (index: number, key: keyof RoundupItem, value: string) => { setIssue((current) => ({
    ...current, roundup_items: current.roundup_items.map((item, i) => i === index ? { ...item, [key]: value } : item),
  })); markDirty(); };

  const removeRoundupItem = (index: number) => setIssue((current) => ({
    ...current, roundup_items: current.roundup_items.filter((_, i) => i !== index),
  }));

  const moveRoundupItem = (index: number, dir: -1 | 1) => setIssue((current) => {
    const items = [...current.roundup_items];
    const target = index + dir;
    if (target < 0 || target >= items.length) return current;
    [items[index], items[target]] = [items[target], items[index]];
    return { ...current, roundup_items: items };
  });

  const addRoundupItem = () => setIssue((current) => ({
    ...current, roundup_items: [...current.roundup_items, { category: "Custom", title: "", text: "", url: "", image_url: "" }],
  }));

  const toggleExpand = (index: number) => setExpandedItems((current) => ({ ...current, [index]: !current[index] }));

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
    const data = await request(id ? `/api/admin/issues/${id}` : "/api/admin/issues", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issue) });
    setId(data.id); setStatus(data.status); setMessage("Draft saved.");
    setDirty(false); dirtyRef.current = false;
    if (!id) router.replace(`/admin/issues/${data.id}`);
  }

  async function showPreview() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issue) });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const body = text ? tryParseJson(text) : null;
        throw new Error(body?.error || `Preview failed (HTTP ${response.status}).`);
      }
      setPreview(await response.text());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Preview failed."); }
    finally { setBusy(false); }
  }

  function tryParseJson(text: string) { try { return JSON.parse(text); } catch { return null; } }

  async function test() { if (!id) return setMessage("Save the draft before sending a test."); await request(`/api/admin/issues/${id}/test`, { method: "POST" }); setMessage("Test email sent."); }
  async function approve() { if (!id) return setMessage("Save the draft before scheduling."); if (!approved) return setMessage("Confirm that you reviewed and approved this issue first."); const data = await request(`/api/admin/issues/${id}/approve`, { method: "POST" }); setStatus(data.status); setMessage(`Approved for ${new Date(data.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT.`); router.refresh(); }

  function chooseArticle(url: string) {
    const article = articles.find((item) => item.url === url); if (!article) return;
    setIssue((current) => ({ ...current, featured_title: article.title, featured_preview: article.preview, featured_url: article.url, featured_image_url: article.image }));
  }

  const locked = status === "sent" || status === "sending";

  // Auto-save: every 30 seconds if dirty, and on beforeunload
  useEffect(() => {
    const autoSave = async () => {
      if (!dirtyRef.current || locked) return;
      const currentId = idRef.current;
      if (!currentId) return; // Wait for first manual save to create the issue
      try {
        dirtyRef.current = false;
        setDirty(false);
        await request(`/api/admin/issues/${currentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issueRef.current) });
      } catch { dirtyRef.current = true; setDirty(true); } // Re-mark dirty on failure
    };
    saveTimerRef.current = setInterval(autoSave, 30000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [locked]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    };
    const onLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link || !dirtyRef.current || locked || !idRef.current) return;
      if (link.getAttribute("href")?.startsWith("/admin/issues/") || link.getAttribute("href") === "/admin" || link.getAttribute("href")?.startsWith("/admin/issues/new")) {
        e.preventDefault();
        const href = link.getAttribute("href") || "/admin";
        (async () => {
          try { await request(`/api/admin/issues/${idRef.current}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issueRef.current) }); } catch {}
          window.location.href = href;
        })();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onLinkClick);
    return () => { window.removeEventListener("beforeunload", onUnload); document.removeEventListener("click", onLinkClick); };
  }, [locked]);

  const filteredArticles = articles.filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div className="page-heading"><div><p className="eyebrow">The Edit, Delivered</p><h1>{id ? issue.title || "Untitled issue" : "New weekly issue"}</h1><p><span className={`status ${status}`}>{status}</span>{initial?.scheduled_for && ` Scheduled ${new Date(initial.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT`}</p></div><a href="/admin" className="secondary link-button">Back to issues</a></div>
    {message && <p className={`message ${/failed|error|unable|review|complete|Select|Add/i.test(message) ? "error" : "success"}`}>{message}</p>}
    <div className="editor-layout">
      <form className="editor stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>

        {/* Section 1: Issue Details */}
        <fieldset disabled={busy || locked}>
          <legend>1. Issue Details</legend>
          <div className="two-col">
            <label>Internal title<input value={issue.title} onChange={(e) => field("title", e.target.value)} placeholder="e.g. Week of Jul 27" required /></label>
            <label>Email subject<input value={issue.subject} onChange={(e) => field("subject", e.target.value)} placeholder="Shown in subscribers' inboxes" required /></label>
          </div>
          <label>Inbox preview text<input value={issue.preview_text} onChange={(e) => field("preview_text", e.target.value)} maxLength={240} placeholder="Short teaser shown below the subject line" /></label>
          <label>Optional scheduled date<input type="datetime-local" value={issue.scheduled_for} onChange={(e) => field("scheduled_for", e.target.value)} /></label>
        </fieldset>

        {/* Section 2: Opening Note */}
        <fieldset disabled={busy || locked}>
          <legend>2. From the Editor</legend>
          <label>Personal note<textarea rows={6} value={issue.note_from_sabrina} onChange={(e) => field("note_from_sabrina", e.target.value)} placeholder="Welcome readers and introduce this week&rsquo;s issue." /></label>
        </fieldset>

        {/* Section 3: Featured Blog */}
        <fieldset disabled={busy || locked}>
          <legend>3. Featured Blog</legend>
          <label>Select a published article</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="text" placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, margin: 0 }} />
            <select value="" onChange={(e) => chooseArticle(e.target.value)} style={{ width: "auto", minWidth: 200 }}>
              <option value="">{filteredArticles.length ? `Choose from ${filteredArticles.length} articles...` : "No articles found"}</option>
              {filteredArticles.map((article) => <option key={article.url} value={article.url}>{article.title}</option>)}
            </select>
          </div>
          <label>Article title<input value={issue.featured_title} onChange={(e) => field("featured_title", e.target.value)} placeholder="Auto-filled when you select an article" /></label>
          <label>Short excerpt<textarea rows={3} value={issue.featured_preview} onChange={(e) => field("featured_preview", e.target.value)} placeholder="Preview text for the featured article" /></label>
          <div className="two-col" style={{ textAlign: "center" }}>
            <label>Article URL<input type="url" value={issue.featured_url} onChange={(e) => field("featured_url", e.target.value)} placeholder="https://www.itschevere.com/posts/..." style={{ textAlign: "center" }} /></label>
            <ImageField label="Featured image" value={issue.featured_image_url} onChange={(url) => field("featured_image_url", url)} disabled={busy || locked} />
          </div>
          {issue.featured_image_url && issue.featured_title && (
            <div style={{ marginTop: 16, padding: 16, border: "1px solid var(--line)", borderRadius: 12, background: "#faf7f1" }}>
              <img src={issue.featured_image_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />
              <div className="kicker" style={{ fontSize: 11, color: "var(--brown)", marginBottom: 6 }}>Featured</div>
              <strong style={{ fontFamily: "Georgia, serif", fontSize: 18, display: "block", marginBottom: 6 }}>{issue.featured_title}</strong>
              <p style={{ fontSize: 14, color: "#5f5c56", lineHeight: 1.5, margin: 0 }}>{issue.featured_preview}</p>
              <span style={{ display: "inline-block", marginTop: 12, padding: "8px 20px", background: "var(--brown)", color: "#fffdf8", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 8 }}>Read the story</span>
            </div>
          )}
        </fieldset>

        {/* Section 4: Weekly Chévere Picks */}
        <fieldset disabled={busy || locked}>
          <legend>4. Weekly Ch&eacute;vere Picks</legend>
          {issue.roundup_items.map((item, index) => {
            const isDefaultCat = isDefault(item.category) && index < 4;
            return (
              <div className="recommendation" key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  {isDefaultCat ? (
                    <strong style={{ fontSize: 14, color: "var(--brown)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.category}</strong>
                  ) : (
                    <input aria-label="Category name" value={item.category} onChange={(e) => updateRoundupItem(index, "category", e.target.value)} placeholder="Category name" style={{ fontWeight: 600, fontSize: 14, margin: 0, padding: "4px 8px", width: "auto", minWidth: 120 }} />
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="text-button" onClick={() => moveRoundupItem(index, -1)} disabled={index === 0} style={{ fontSize: 12, padding: "2px 6px" }}>&uarr;</button>
                    <button type="button" className="text-button" onClick={() => moveRoundupItem(index, 1)} disabled={index === issue.roundup_items.length - 1} style={{ fontSize: 12, padding: "2px 6px" }}>&darr;</button>
                    <button type="button" className="text-button" onClick={() => removeRoundupItem(index)} style={{ fontSize: 12, padding: "2px 6px", color: "var(--red)" }}>Remove</button>
                  </div>
                </div>
                <input aria-label={`Title ${index + 1}`} value={item.title} onChange={(e) => updateRoundupItem(index, "title", e.target.value)} placeholder="Item title" style={{ marginBottom: 8 }} />
                <textarea aria-label={`Description ${index + 1}`} rows={2} value={item.text} onChange={(e) => updateRoundupItem(index, "text", e.target.value)} placeholder="One short description" style={{ marginBottom: 8 }} />
                {!expandedItems[index] && (
                  <button type="button" className="text-button" onClick={() => toggleExpand(index)} style={{ fontSize: 12, padding: "2px 0" }}>+ Add image or link</button>
                )}
                {expandedItems[index] && (
                  <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                    <input type="url" aria-label={`Link ${index + 1}`} value={item.url} onChange={(e) => updateRoundupItem(index, "url", e.target.value)} placeholder="Optional link (https://...)" />
                    <ImageField label="Optional image" value={item.image_url} onChange={(url) => updateRoundupItem(index, "image_url", url)} disabled={busy || locked} />
                    <button type="button" className="text-button" onClick={() => toggleExpand(index)} style={{ fontSize: 12, padding: "2px 0" }}>&minus; Hide image or link</button>
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" className="secondary" onClick={addRoundupItem} style={{ fontSize: 13, padding: "7px 14px" }}>+ Add item</button>
        </fieldset>

        {/* Section 5: Closing */}
        <fieldset disabled={busy || locked}>
          <legend>5. Closing</legend>
          <label>Closing note<textarea rows={5} value={issue.closing_note} onChange={(e) => field("closing_note", e.target.value)} placeholder="End the issue with a personal thought, question, or invitation to reply." /></label>
          <label>Sign-off<textarea rows={2} value={issue.signoff} onChange={(e) => field("signoff", e.target.value)} placeholder="Until next week,&#10;Stay CHÉVERE" /></label>
        </fieldset>

        <label className="approval-check"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} disabled={busy || locked} /><span>I reviewed this specific issue and approve it for delivery.</span></label>
        <div className="action-bar">
          <button className="primary" disabled={busy || locked}>Save draft</button>
          <button type="button" className="secondary" onClick={showPreview} disabled={busy}>Preview</button>
          <button type="button" className="secondary" onClick={test} disabled={busy || !id}>Send test</button>
          <button type="button" className="approve" onClick={approve} disabled={busy || !id || locked || !approved}>Approve &amp; schedule</button>
        </div>
      </form>

      <aside className="preview-panel">
        <div className="preview-toolbar"><strong>Email preview</strong><div><button className={previewWidth === "desktop" ? "active" : ""} onClick={() => setPreviewWidth("desktop")}>Desktop</button><button className={previewWidth === "mobile" ? "active" : ""} onClick={() => setPreviewWidth("mobile")}>Mobile</button></div></div>
        {preview ? <iframe title="Newsletter preview" srcDoc={preview} className={previewWidth} /> : <div className="preview-empty">Choose Preview to render the exact email.</div>}
      </aside>
    </div>
  </>;
}