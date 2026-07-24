"use client";

import { useState } from "react";

import type { SiteContent } from "@/lib/site-content";

export function SiteContentEditor({ initialContent }: { initialContent: SiteContent }) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function updateBanner(field: keyof SiteContent["seasonal_banner"], value: string | boolean) {
    setContent((current) => ({
      ...current,
      seasonal_banner: { ...current.seasonal_banner, [field]: value },
    }));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save homepage content.");
      setStatus("The Summer Guide was saved and published.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="site-content-editor">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Homepage</p>
            <h2>The Summer Guide</h2>
          </div>
          <label className="toggle-label">
            <input type="checkbox" checked={content.seasonal_banner.enabled} onChange={(event) => updateBanner("enabled", event.target.checked)} />
            Show seasonal guide
          </label>
        </div>
        <div className="editor-grid">
          <label>Season label<input value={content.seasonal_banner.label} onChange={(event) => updateBanner("label", event.target.value)} /></label>
          <label>Headline<input value={content.seasonal_banner.headline} onChange={(event) => updateBanner("headline", event.target.value)} /></label>
          <label className="span-2">Description<textarea rows={3} value={content.seasonal_banner.description} onChange={(event) => updateBanner("description", event.target.value)} /></label>
          <label>Destination URL<input value={content.seasonal_banner.href} onChange={(event) => updateBanner("href", event.target.value)} /></label>
          <label>CTA label<input value={content.seasonal_banner.cta_label} onChange={(event) => updateBanner("cta_label", event.target.value)} /></label>
          <label>Publish date<input type="date" value={content.seasonal_banner.publish_date} onChange={(event) => updateBanner("publish_date", event.target.value)} /></label>
          <label>Expiration date <span className="optional">(optional)</span><input type="date" value={content.seasonal_banner.expiration_date} onChange={(event) => updateBanner("expiration_date", event.target.value)} /></label>
        </div>
      </section>
      <div className="editor-actions">
        <button type="button" className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save The Summer Guide"}</button>
        {status ? <p role="status">{status}</p> : null}
      </div>
    </div>
  );
}
