import type { IssueInput } from "@/lib/types";

/** Map the new IssueInput shape to the existing database column names.
 *  The DB still has the old schema (recommendations, obsessed_*, weekend_*, last_thing, note_from_sabrina)
 *  but the editor now uses roundup_items, closing_note, and signoff. */
export function toDbRow(issue: IssueInput): Record<string, unknown> {
  return {
    title: issue.title,
    subject: issue.subject,
    preview_text: issue.preview_text,
    note_from_sabrina: issue.signoff || "",
    recommendations: JSON.stringify(issue.roundup_items || []),
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
  };
}

/** Map a database row (with old column names) back to the new IssueInput shape. */
export function fromDbRow(row: Record<string, unknown>): IssueInput {
  const recs = row.recommendations;
  let roundupItems: IssueInput["roundup_items"] = [];
  if (Array.isArray(recs)) {
    roundupItems = recs as IssueInput["roundup_items"];
  } else if (typeof recs === "string") {
    try { roundupItems = JSON.parse(recs); } catch { roundupItems = []; }
  }
  if (!Array.isArray(roundupItems)) roundupItems = [];

  const hasOldItems = roundupItems.length === 0 && (row.obsessed_title || row.weekend_title);
  if (hasOldItems) {
    const items: IssueInput["roundup_items"] = [];
    if (row.obsessed_title) items.push({ category: "Currently Obsessed", title: String(row.obsessed_title), text: String(row.obsessed_text || ""), url: String(row.obsessed_url || ""), image_url: "" });
    if (row.weekend_title) items.push({ category: "For the Weekend", title: String(row.weekend_title), text: String(row.weekend_text || ""), url: String(row.weekend_url || ""), image_url: "" });
    roundupItems = items;
  }

  return {
    title: String(row.title || ""),
    subject: String(row.subject || ""),
    preview_text: String(row.preview_text || ""),
    scheduled_for: row.scheduled_for ? String(row.scheduled_for) : "",
    featured_title: String(row.featured_title || ""),
    featured_preview: String(row.featured_preview || ""),
    featured_url: String(row.featured_url || ""),
    featured_image_url: String(row.featured_image_url || ""),
    roundup_items: roundupItems,
    closing_note: String(row.last_thing || ""),
    signoff: String(row.note_from_sabrina || "Until next week,\nSabrina"),
  };
}