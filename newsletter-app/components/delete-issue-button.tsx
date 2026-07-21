"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteIssueButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this issue draft? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/issues/${id}`, { method: "DELETE" });
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
    <button type="button" className="text-button" onClick={handleDelete} disabled={busy} style={{ color: "var(--red)", fontSize: 12 }}>
      {busy ? "..." : "Delete"}
    </button>
  );
}