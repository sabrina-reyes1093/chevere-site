import { z } from "zod";

const roundupItem = z.object({
  category: z.string().trim().max(60),
  title: z.string().trim().max(200),
  text: z.string().trim().max(1000),
  url: z.string().trim().url().or(z.literal("")),
  image_url: z.string().trim().url().or(z.literal("")),
});

export const issueSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  preview_text: z.string().trim().max(240),
  scheduled_for: z.string().trim().max(40).or(z.literal("")),
  featured_title: z.string().trim().max(200),
  featured_preview: z.string().trim().max(1200),
  featured_url: z.string().trim().url().or(z.literal("")),
  featured_image_url: z.string().trim().url().or(z.literal("")),
  roundup_items: z.array(roundupItem).max(10),
  closing_note: z.string().trim().max(5000),
  signoff: z.string().trim().max(200),
});

export function validateForApproval(value: z.infer<typeof issueSchema>) {
  const hasFeature = value.featured_title && value.featured_preview && value.featured_url && value.featured_image_url;
  const hasRoundup = value.roundup_items.some((item) => item.title && item.text);
  if (!hasFeature) return "Select a featured blog post before scheduling.";
  if (!hasRoundup) return "Add at least one roundup item before scheduling.";
  if (!value.closing_note) return "Add a closing note before scheduling.";
  return null;
}