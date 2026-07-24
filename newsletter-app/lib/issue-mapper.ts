import { chicagoLocalToIso } from "@/lib/schedule";
import type { IssueInput, RoundupItem } from "@/lib/types";

export function normalizeRoundupTitle(title: string) {
  return /therapuss/i.test(title) ? "THERAPUSS by Jake Shane" : title;
}

function parseStoredItems(stored: unknown) {
  let parsed: unknown = stored;
  if (typeof stored === "string") {
    try { parsed = JSON.parse(stored); } catch { parsed = []; }
  }
  return Array.isArray(parsed) ? parsed as Partial<RoundupItem>[] : [];
}

function storedItems(row: Record<string, unknown>) {
  const roundup = parseStoredItems(row.roundup_items);
  return roundup.length ? roundup : parseStoredItems(row.recommendations);
}

function normalizeItems(row: Record<string, unknown>) {
  let items = storedItems(row);
  if (!items.length && (row.obsessed_title || row.weekend_title)) {
    items = [
      ...(row.obsessed_title ? [{ category: "Currently Obsessed", title: String(row.obsessed_title), text: String(row.obsessed_text || ""), url: String(row.obsessed_url || "") }] : []),
      ...(row.weekend_title ? [{ category: "For the Weekend", title: String(row.weekend_title), text: String(row.weekend_text || ""), url: String(row.weekend_url || "") }] : []),
    ];
  }
  return items.slice(0, 3).map((item, index): RoundupItem => ({
    id: String(item.id || `${row.id || "issue"}-card-${index + 1}`),
    category: String(item.category || ""),
    title: normalizeRoundupTitle(String(item.title || "")),
    text: String(item.text || ""),
    url: String(item.url || ""),
    image_url: String(item.image_url || ""),
    image_alt: String(item.image_alt || ""),
    link_type: item.link_type === "internal" ? "internal" : "external",
    cta_label: String(item.cta_label || "Read More"),
    display_order: index + 1,
  }));
}

export function toDbRow(issue: IssueInput): Record<string, unknown> {
  const roundupItems = (issue.roundup_items || []).map((item, index) => ({
    ...item,
    title: normalizeRoundupTitle(item.title),
    display_order: index + 1,
  }));
  return {
    note_from_sabrina: issue.note_from_sabrina || "",
    title: issue.title,
    subject: issue.subject,
    preview_text: issue.preview_text,
    issue_date: issue.issue_date || null,
    scheduled_for: issue.scheduled_for ? chicagoLocalToIso(issue.scheduled_for) : null,
    homepage_publish_at: issue.homepage_publish_at ? chicagoLocalToIso(issue.homepage_publish_at) : null,
    roundup_status: issue.roundup_status || "draft",
    roundup_items: roundupItems,
    recommendations: roundupItems,
    featured_title: issue.featured_title,
    featured_preview: issue.featured_preview,
    featured_url: issue.featured_url,
    featured_image_url: issue.featured_image_url,
    obsessed_title: "",
    obsessed_text: "",
    obsessed_url: "",
    weekend_title: "",
    weekend_text: "",
    weekend_url: "",
    last_thing: issue.closing_note || "",
    closing_note: issue.closing_note || "",
    signoff: issue.signoff || "",
  };
}

export function fromDbRow(row: Record<string, unknown>): IssueInput {
  const status = String(row.roundup_status || "draft");
  return {
    note_from_sabrina: String(row.note_from_sabrina || ""),
    title: String(row.title || ""),
    subject: String(row.subject || ""),
    preview_text: String(row.preview_text || ""),
    issue_date: row.issue_date ? String(row.issue_date) : "",
    scheduled_for: row.scheduled_for ? String(row.scheduled_for) : "",
    homepage_publish_at: row.homepage_publish_at ? String(row.homepage_publish_at) : "",
    roundup_status: status === "scheduled" || status === "published" || status === "archived" ? status : "draft",
    featured_title: String(row.featured_title || ""),
    featured_preview: String(row.featured_preview || ""),
    featured_url: String(row.featured_url || ""),
    featured_image_url: String(row.featured_image_url || ""),
    roundup_items: normalizeItems(row),
    closing_note: String(row.closing_note || row.last_thing || ""),
    signoff: String(row.signoff || "Until next week,\nStay CHÉVERE"),
  };
}
