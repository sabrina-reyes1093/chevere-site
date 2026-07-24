import { z } from "zod";

const roundupItem = z.object({
  id: z.string().trim().min(1).max(100),
  category: z.string().trim().max(60),
  title: z.string().trim().max(200),
  text: z.string().trim().max(1000),
  url: z.string().trim().max(1000),
  image_url: z.string().trim().max(1000),
  image_alt: z.string().trim().max(240),
  link_type: z.enum(["internal", "external"]),
  cta_label: z.string().trim().max(60),
  display_order: z.number().int().min(1).max(3),
});

export const issueSchema = z.object({
  note_from_sabrina: z.string().trim().max(10000),
  title: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  preview_text: z.string().trim().max(240),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").or(z.literal("")),
  scheduled_for: z.string().trim().max(40).or(z.literal("")),
  homepage_publish_at: z.string().trim().max(40).or(z.literal("")),
  roundup_status: z.enum(["draft", "scheduled", "published", "archived"]),
  featured_title: z.string().trim().max(200),
  featured_preview: z.string().trim().max(1200),
  featured_url: z.string().trim().url().or(z.literal("")),
  featured_image_url: z.string().trim().url().or(z.literal("")),
  roundup_items: z.array(roundupItem).max(3),
  closing_note: z.string().trim().max(5000),
  signoff: z.string().trim().max(200),
});

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isInternalUrl(value: string) {
  return /^(\/(?!\/)|\.{1,2}\/)/.test(value);
}

export function validateRoundupForPublication(value: z.infer<typeof issueSchema>) {
  if (value.roundup_items.length !== 3) return "Add exactly three complete roundup cards.";
  const orders = new Set<number>();
  const urls = new Set<string>();
  for (const [index, item] of value.roundup_items.entries()) {
    const label = `Roundup Card ${index + 1}`;
    if (!item.image_url) return `${label} needs an image.`;
    if (!item.image_alt) return `${label} needs meaningful image alt text.`;
    if (!item.title) return `${label} needs a title.`;
    if (!item.url) return `${label} needs a destination URL.`;
    if (item.link_type === "external" && !isHttpUrl(item.url)) return `${label} needs a valid external http or https URL.`;
    if (item.link_type === "internal" && !isInternalUrl(item.url) && !isHttpUrl(item.url)) return `${label} needs a valid internal URL.`;
    if (!isHttpUrl(item.image_url) && !isInternalUrl(item.image_url)) return `${label} needs a valid image URL.`;
    if (urls.has(item.url)) return "Each roundup card needs a unique destination URL.";
    urls.add(item.url);
    if (orders.has(item.display_order)) return "Each roundup card needs a unique display order.";
    orders.add(item.display_order);
  }
  return null;
}

export function validateForApproval(value: z.infer<typeof issueSchema>) {
  const hasFeature = value.featured_title && value.featured_preview && value.featured_url && value.featured_image_url;
  if (!hasFeature) return "Select a featured blog post before scheduling.";
  const roundupError = validateRoundupForPublication(value);
  if (roundupError) return roundupError;
  if (!value.closing_note) return "Add a closing note before scheduling.";
  return null;
}
