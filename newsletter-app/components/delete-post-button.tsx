"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeletePostButton({ id, published }: { id: string; published: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const msg = published
      ? "Delete this published post? It will be removed from the live site and the blog listing. This cannot be undone."
      : "Delete this draft? This cannot be undone.";
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="secondary" onClick={handleDelete} disabled={busy} style={{ fontSize: 13, padding: "6px 14px", minHeight: 32, borderColor: "var(--red)", color: "var(--red)", marginLeft: 6 }}>
      {busy ? "..." : "Delete"}
    </button>
  );
}