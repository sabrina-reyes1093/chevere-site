import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { DeleteIssueButton } from "@/components/delete-issue-button";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdminPage();
  const db = createAdminClient();
  const [{ data: issues }, { count: activeSubscribers }, { data: attempts }, { data: deliveries }] = await Promise.all([
    db.from("newsletter_issues").select("id,title,status,roundup_status,homepage_publish_at,scheduled_for,sent_at,recipient_count,updated_at,last_error").order("created_at", { ascending: false }),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active").not("confirmed_at", "is", null),
    db.from("newsletter_send_attempts").select("id,result,reason,error,started_at").order("started_at", { ascending: false }).limit(8),
    db.from("newsletter_deliveries").select("issue_id,status,delivered_at,opened_at,clicked_at,unsubscribed_at"),
  ]);
  const metrics = new Map<string, { successful: number; failures: number; opens: number; clicks: number; unsubscribes: number }>();
  for (const delivery of deliveries || []) {
    const current = metrics.get(delivery.issue_id) || { successful: 0, failures: 0, opens: 0, clicks: 0, unsubscribes: 0 };
    if (delivery.delivered_at) current.successful += 1;
    if (delivery.status === "failed") current.failures += 1;
    if (delivery.opened_at) current.opens += 1;
    if (delivery.clicked_at) current.clicks += 1;
    if (delivery.unsubscribed_at) current.unsubscribes += 1;
    metrics.set(delivery.issue_id, current);
  }
  return <AdminShell>
    <div className="page-heading"><div><p className="eyebrow">Weekly publishing</p><h1>Newsletter issues</h1><p>{activeSubscribers || 0} active subscribers</p></div><Link href="/admin/issues/new" className="primary link-button">Create issue</Link></div>
    <section className="panel">
      <div className="table-wrap"><table><thead><tr><th>Issue</th><th>Email</th><th>Homepage</th><th>Scheduled / sent</th><th>Recipients</th><th>Delivered</th><th>Failures</th><th>Opens</th><th>Clicks</th><th>Unsubscribes</th><th>Actions</th></tr></thead><tbody>
        {(issues || []).map((issue) => { const issueMetrics = metrics.get(issue.id); return <tr key={issue.id}>
          <td><Link href={`/admin/issues/${issue.id}`}><strong>{issue.title}</strong></Link>{issue.last_error && <small className="error-text">{issue.last_error}</small>}</td>
            <td><span className={`status ${issue.status}`}>{issue.status}</span></td>
            <td><span className={`status ${issue.roundup_status === "published" ? "sent" : issue.roundup_status}`}>{issue.roundup_status || "draft"}</span>{issue.homepage_publish_at && <small>{new Date(issue.homepage_publish_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</small>}</td>
          <td>{issue.sent_at ? new Date(issue.sent_at).toLocaleString() : issue.scheduled_for ? new Date(issue.scheduled_for).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) + " CT" : "—"}</td>
          <td>{issue.recipient_count || "—"}</td>
          <td>{issueMetrics?.successful || "—"}</td>
          <td>{issueMetrics?.failures || "—"}</td>
          <td>{issueMetrics?.opens || "—"}</td>
          <td>{issueMetrics?.clicks || "—"}</td>
          <td>{issueMetrics?.unsubscribes || "—"}</td>
          <td style={{ whiteSpace: "nowrap" }}>
            <Link href={`/admin/issues/${issue.id}`} className="secondary" style={{ fontSize: 13, padding: "6px 14px", minHeight: 32, display: "inline-flex", marginRight: 6 }}>Edit</Link>
            {issue.status !== "sent" && issue.status !== "sending" && <DeleteIssueButton id={issue.id} />}
          </td>
        </tr>})}
        {!issues?.length && <tr><td colSpan={11}>No issues yet. Create the first weekly issue.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel"><h2>Recent schedule activity</h2><ul className="activity-list">{(attempts || []).map((attempt) => <li key={attempt.id}><span className={`status ${attempt.result}`}>{attempt.result.replaceAll("_", " ")}</span><span>{attempt.reason || attempt.error || "Provider request completed."}</span><time>{new Date(attempt.started_at).toLocaleString()}</time></li>)}{!attempts?.length && <li>No schedule activity recorded yet.</li>}</ul></section>
  </AdminShell>;
}
