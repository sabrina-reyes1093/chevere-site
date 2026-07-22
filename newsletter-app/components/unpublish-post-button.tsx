"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnpublishPostButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleUnpublish() {
    if (!confirm("Unpublish this post? It will be removed from the live site.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}/publish`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unpublish failed.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unpublish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="secondary" onClick={handleUnpublish} disabled={busy} style={{ fontSize: 13, padding: "6px 14px", minHeight: 32, borderColor: "var(--red)", color: "var(--red)", marginRight: 6 }}>
      {busy ? "..." : "Unpublish"}
    </button>
  );
}