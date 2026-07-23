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

  function updateLoving(index: number, field: keyof SiteContent["currently_loving"][number], value: string) {
    setContent((current) => ({
      ...current,
      currently_loving: current.currently_loving.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
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
      setStatus("Homepage content saved and published.");
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
            <h2>Seasonal banner</h2>
          </div>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={content.seasonal_banner.enabled}
              onChange={(event) => updateBanner("enabled", event.target.checked)}
            />
            Show banner
          </label>
        </div>
        <div className="editor-grid">
          <label>Season label<input value={content.seasonal_banner.label} onChange={(event) => updateBanner("label", event.target.value)} /></label>
          <label>Headline<input value={content.seasonal_banner.headline} onChange={(event) => updateBanner("headline", event.target.value)} /></label>
          <label className="span-2">Description<textarea rows={3} value={content.seasonal_banner.description} onChange={(event) => updateBanner("description", event.target.value)} /></label>
          <label className="span-2">Link<input value={content.seasonal_banner.href} onChange={(event) => updateBanner("href", event.target.value)} /></label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Weekly edit</p>
            <h2>Currently Loving</h2>
          </div>
          <p>Up to six editor recommendations.</p>
        </div>
        <div className="loving-editor-list">
          {content.currently_loving.map((item, index) => (
            <fieldset key={index} className="loving-editor-card">
              <legend>{index + 1}. {item.category || "Recommendation"}</legend>
              <div className="editor-grid">
                <label>Category<input value={item.category} onChange={(event) => updateLoving(index, "category", event.target.value)} /></label>
                <label>Title<input value={item.title} onChange={(event) => updateLoving(index, "title", event.target.value)} /></label>
                <label className="span-2">Description<textarea rows={3} value={item.description} onChange={(event) => updateLoving(index, "description", event.target.value)} /></label>
                <label>Article URL<input value={item.url} onChange={(event) => updateLoving(index, "url", event.target.value)} /></label>
                <label>Optional image URL<input value={item.image_url} onChange={(event) => updateLoving(index, "image_url", event.target.value)} /></label>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <div className="editor-actions">
        <button type="button" className="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save homepage content"}
        </button>
        {status ? <p role="status">{status}</p> : null}
      </div>
    </div>
  );
}
