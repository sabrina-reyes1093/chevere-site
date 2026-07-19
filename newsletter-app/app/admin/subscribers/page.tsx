import { AdminShell } from "@/components/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  await requireAdminPage();
  const db = createAdminClient();
  const [{ data: subscribers, error }, { count: activeCount }, { count: unsubscribedCount }] = await Promise.all([
    db.from("newsletter_subscribers").select("id,email,status,created_at,updated_at,unsubscribed_at").order("created_at", { ascending: false }).limit(1000),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "unsubscribed"),
  ]);

  return <AdminShell>
    <div className="page-heading"><div><p className="eyebrow">Audience</p><h1>Subscribers</h1><p>Private newsletter audience list</p></div><a href="/admin" className="secondary link-button">Back to issues</a></div>
    <section className="subscriber-stats" aria-label="Subscriber totals">
      <div className="stat-card"><strong>{(activeCount || 0) + (unsubscribedCount || 0)}</strong><span>Total</span></div>
      <div className="stat-card"><strong>{activeCount || 0}</strong><span>Active</span></div>
      <div className="stat-card"><strong>{unsubscribedCount || 0}</strong><span>Unsubscribed</span></div>
    </section>
    <section className="panel">
      {error ? <p className="message error">The subscriber list could not be loaded.</p> : <div className="table-wrap"><table><thead><tr><th>Email</th><th>Status</th><th>Subscribed</th><th>Last updated</th><th>Unsubscribed</th></tr></thead><tbody>
        {(subscribers || []).map((subscriber) => <tr key={subscriber.id}>
          <td><strong>{subscriber.email}</strong></td>
          <td><span className={`status ${subscriber.status}`}>{subscriber.status}</span></td>
          <td>{new Date(subscriber.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</td>
          <td>{new Date(subscriber.updated_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</td>
          <td>{subscriber.unsubscribed_at ? new Date(subscriber.unsubscribed_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) + " CT" : "—"}</td>
        </tr>)}
        {!subscribers?.length && <tr><td colSpan={5}>No subscribers yet.</td></tr>}
      </tbody></table></div>}
    </section>
  </AdminShell>;
}
