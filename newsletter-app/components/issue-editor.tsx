"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, IssueInput, Recommendation } from "@/lib/types";
import { ImageField } from "@/components/image-field";

const emptyRecommendation = (): Recommendation => ({ title: "", text: "", url: "", image_url: "" });
const empty: IssueInput = {
  title: "", subject: "", preview_text: "", note_from_sabrina: "",
  recommendations: [emptyRecommendation(), emptyRecommendation(), emptyRecommendation()],
  featured_title: "", featured_preview: "", featured_url: "", featured_image_url: "",
  obsessed_title: "", obsessed_text: "", obsessed_url: "",
  weekend_title: "", weekend_text: "", weekend_url: "", last_thing: "",
};
type Article = { title: string; preview: string; url: string; image: string };

export function IssueEditor({ initial }: { initial?: Issue }) {
  const router = useRouter();
  const [issue, setIssue] = useState<IssueInput>(initial || empty);
  const [id, setId] = useState(initial?.id || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [articles, setArticles] = useState<Article[]>([]);
  const [approved, setApproved] = useState(false);
  useEffect(() => { fetch("/api/articles").then((r) => r.ok ? r.json() : []).then(setArticles).catch(() => setArticles([])); }, []);

  const field = (name: keyof IssueInput, value: string) => setIssue((current) => ({ ...current, [name]: value }));
  const recommendation = (index: number, key: keyof Recommendation, value: string) => setIssue((current) => ({
    ...current, recommendations: current.recommendations.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
  }));
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
    if (!id) router.replace(`/admin/issues/${data.id}`);
  }
  async function showPreview() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issue) });
      if (!response.ok) throw new Error((await response.json()).error || "Preview failed.");
      setPreview(await response.text());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Preview failed."); }
    finally { setBusy(false); }
  }
  async function test() { if (!id) return setMessage("Save the draft before sending a test."); await request(`/api/admin/issues/${id}/test`, { method: "POST" }); setMessage("Test email sent."); }
  async function approve() { if (!id) return setMessage("Save the draft before scheduling."); if (!approved) return setMessage("Confirm that you reviewed and approved this issue first."); const data = await request(`/api/admin/issues/${id}/approve`, { method: "POST" }); setStatus(data.status); setMessage(`Approved for ${new Date(data.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT.`); router.refresh(); }
  function chooseArticle(url: string) {
    const article = articles.find((item) => item.url === url); if (!article) return;
    setIssue((current) => ({ ...current, featured_title: article.title, featured_preview: article.preview, featured_url: article.url, featured_image_url: article.image }));
  }
  const locked = status === "sent" || status === "sending";

  return <>
    <div className="page-heading"><div><p className="eyebrow">The Edit, Delivered</p><h1>{id ? issue.title || "Untitled issue" : "New weekly issue"}</h1><p><span className={`status ${status}`}>{status}</span>{initial?.scheduled_for && ` Scheduled ${new Date(initial.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT`}</p></div><a href="/admin" className="secondary link-button">Back to issues</a></div>
    {message && <p className={`message ${/failed|error|unable|review|complete/i.test(message) ? "error" : "success"}`}>{message}</p>}
    <div className="editor-layout">
      <form className="editor stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy || locked}><legend>Issue details</legend><div className="two-col"><label>Internal title<input value={issue.title} onChange={(e) => field("title", e.target.value)} required /></label><label>Email subject<input value={issue.subject} onChange={(e) => field("subject", e.target.value)} required /></label></div><label>Inbox preview text<input value={issue.preview_text} onChange={(e) => field("preview_text", e.target.value)} maxLength={240} /></label></fieldset>
        <fieldset disabled={busy || locked}><legend>A Note from Sabrina</legend><label>Personal introduction<textarea rows={7} value={issue.note_from_sabrina} onChange={(e) => field("note_from_sabrina", e.target.value)} /></label></fieldset>
        <fieldset disabled={busy || locked}><legend>This Week’s Edit</legend>{issue.recommendations.map((item, index) => <div className="recommendation" key={index}><strong>Recommendation {index + 1}</strong><input aria-label={`Recommendation ${index + 1} title`} placeholder="Title" value={item.title} onChange={(e) => recommendation(index, "title", e.target.value)} /><textarea aria-label={`Recommendation ${index + 1} description`} rows={3} placeholder="Why it’s worth discovering" value={item.text} onChange={(e) => recommendation(index, "text", e.target.value)} /><input aria-label={`Recommendation ${index + 1} link`} type="url" placeholder="https://" value={item.url} onChange={(e) => recommendation(index, "url", e.target.value)} /><ImageField label={`Recommendation ${index + 1} image`} value={item.image_url || ""} onChange={(url) => recommendation(index, "image_url", url)} disabled={busy || locked} /></div>)}{issue.recommendations.length < 5 && <button type="button" className="secondary" onClick={() => setIssue((current) => ({ ...current, recommendations: [...current.recommendations, emptyRecommendation()] }))}>Add recommendation</button>}</fieldset>
        <fieldset disabled={busy || locked}><legend>The Chévere Read</legend><label>Select a published article<select value="" onChange={(e) => chooseArticle(e.target.value)}><option value="">Choose from the website…</option>{articles.map((article) => <option key={article.url} value={article.url}>{article.title}</option>)}</select></label><label>Article title<input value={issue.featured_title} onChange={(e) => field("featured_title", e.target.value)} /></label><label>Preview<textarea rows={4} value={issue.featured_preview} onChange={(e) => field("featured_preview", e.target.value)} /></label><div className="two-col"><label>Article link<input type="url" value={issue.featured_url} onChange={(e) => field("featured_url", e.target.value)} /></label><ImageField label="Image" value={issue.featured_image_url} onChange={(url) => field("featured_image_url", url)} disabled={busy || locked} /></div></fieldset>
        <fieldset disabled={busy || locked}><legend>Currently Obsessed</legend><label>Title<input value={issue.obsessed_title} onChange={(e) => field("obsessed_title", e.target.value)} /></label><label>Text<textarea rows={4} value={issue.obsessed_text} onChange={(e) => field("obsessed_text", e.target.value)} /></label><label>Optional link<input type="url" value={issue.obsessed_url} onChange={(e) => field("obsessed_url", e.target.value)} /></label></fieldset>
        <fieldset disabled={busy || locked}><legend>For the Weekend</legend><label>Title<input value={issue.weekend_title} onChange={(e) => field("weekend_title", e.target.value)} /></label><label>Text<textarea rows={4} value={issue.weekend_text} onChange={(e) => field("weekend_text", e.target.value)} /></label><label>Optional link<input type="url" value={issue.weekend_url} onChange={(e) => field("weekend_url", e.target.value)} /></label></fieldset>
        <fieldset disabled={busy || locked}><legend>One Last Thing</legend><label>Closing question<textarea rows={4} value={issue.last_thing} onChange={(e) => field("last_thing", e.target.value)} /></label></fieldset>
        <label className="approval-check"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} disabled={busy || locked} /><span>I reviewed this specific issue and approve it for delivery.</span></label>
        <div className="action-bar"><button className="primary" disabled={busy || locked}>Save draft</button><button type="button" className="secondary" onClick={showPreview} disabled={busy}>Preview</button><button type="button" className="secondary" onClick={test} disabled={busy || !id}>Send test</button><button type="button" className="approve" onClick={approve} disabled={busy || !id || locked || !approved}>Approve & schedule</button></div>
      </form>
      <aside className="preview-panel"><div className="preview-toolbar"><strong>Email preview</strong><div><button className={previewWidth === "desktop" ? "active" : ""} onClick={() => setPreviewWidth("desktop")}>Desktop</button><button className={previewWidth === "mobile" ? "active" : ""} onClick={() => setPreviewWidth("mobile")}>Mobile</button></div></div>{preview ? <iframe title="Newsletter preview" srcDoc={preview} className={previewWidth} /> : <div className="preview-empty">Choose Preview to render the exact email.</div>}</aside>
    </div>
  </>;
}
