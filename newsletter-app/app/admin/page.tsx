import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdminPage();
  const db = createAdminClient();
  const [{ data: issues }, { count: activeSubscribers }, { data: attempts }] = await Promise.all([
    db.from("newsletter_issues").select("id,title,status,scheduled_for,sent_at,recipient_count,updated_at,last_error").order("created_at", { ascending: false }),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active").not("confirmed_at", "is", null),
    db.from("newsletter_send_attempts").select("id,result,reason,error,started_at").order("started_at", { ascending: false }).limit(8),
  ]);
  return <AdminShell>
    <div className="page-heading"><div><p className="eyebrow">Weekly publishing</p><h1>Newsletter issues</h1><p>{activeSubscribers || 0} active, confirmed subscribers</p></div><Link href="/admin/issues/new" className="primary link-button">Create issue</Link></div>
    <section className="panel">
      <div className="table-wrap"><table><thead><tr><th>Issue</th><th>Status</th><th>Scheduled / sent</th><th>Recipients</th></tr></thead><tbody>
        {(issues || []).map((issue) => <tr key={issue.id}>
          <td><Link href={`/admin/issues/${issue.id}`}><strong>{issue.title}</strong></Link>{issue.last_error && <small className="error-text">{issue.last_error}</small>}</td>
          <td><span className={`status ${issue.status}`}>{issue.status}</span></td>
          <td>{issue.sent_at ? new Date(issue.sent_at).toLocaleString() : issue.scheduled_for ? new Date(issue.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) + " CT" : "—"}</td>
          <td>{issue.recipient_count || "—"}</td>
        </tr>)}
        {!issues?.length && <tr><td colSpan={4}>No issues yet. Create the first Friday edit.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel"><h2>Recent schedule activity</h2><ul className="activity-list">{(attempts || []).map((attempt) => <li key={attempt.id}><span className={`status ${attempt.result}`}>{attempt.result.replaceAll("_", " ")}</span><span>{attempt.reason || attempt.error || "Provider request completed."}</span><time>{new Date(attempt.started_at).toLocaleString()}</time></li>)}{!attempts?.length && <li>No schedule activity recorded yet.</li>}</ul></section>
  </AdminShell>;
}
