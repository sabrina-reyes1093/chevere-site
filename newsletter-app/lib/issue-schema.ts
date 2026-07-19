import { z } from "zod";

const recommendation = z.object({
  title: z.string().trim().max(160),
  text: z.string().trim().max(1000),
  url: z.string().trim().url().or(z.literal("")),
  image_url: z.string().trim().url().or(z.literal("")).optional(),
});

export const issueSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  preview_text: z.string().trim().max(240),
  note_from_sabrina: z.string().trim().max(5000),
  recommendations: z.array(recommendation).max(5),
  featured_title: z.string().trim().max(200),
  featured_preview: z.string().trim().max(1200),
  featured_url: z.string().trim().url().or(z.literal("")),
  featured_image_url: z.string().trim().url().or(z.literal("")),
  obsessed_title: z.string().trim().max(200),
  obsessed_text: z.string().trim().max(1200),
  obsessed_url: z.string().trim().url().or(z.literal("")),
  weekend_title: z.string().trim().max(200),
  weekend_text: z.string().trim().max(1200),
  weekend_url: z.string().trim().url().or(z.literal("")),
  last_thing: z.string().trim().max(1200),
});

export function validateForApproval(value: z.infer<typeof issueSchema>) {
  const recommendations = value.recommendations.filter((item) => item.title && item.text && item.url);
  const complete = Boolean(
    value.note_from_sabrina && recommendations.length >= 3 &&
    value.featured_title && value.featured_preview && value.featured_url && value.featured_image_url &&
    value.obsessed_title && value.obsessed_text && value.weekend_title && value.weekend_text && value.last_thing
  );
  return complete ? null : "Complete every section and include at least three linked recommendations before scheduling.";
}
