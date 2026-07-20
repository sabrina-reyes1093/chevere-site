import { z } from "zod";

/** Categories match the filter pills in blog.html. */
export const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "tv-film", label: "TV & Film" },
  { slug: "travel", label: "Travel" },
  { slug: "food-drink", label: "Food & Drink" },
  { slug: "fashion", label: "Fashion" },
  { slug: "sports", label: "Sports" },
  { slug: "culture", label: "Culture" },
] as const;

const categorySlugs = CATEGORIES.map((item) => item.slug) as unknown as [string, ...string[]];

export const postSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  title: z.string().trim().min(1).max(160),
  category: z.enum(categorySlugs),
  dek: z.string().trim().max(400),
  body: z.string().max(60000),
  cover_image_url: z.string().trim().url().or(z.literal("")),
  hero_image_url: z.string().trim().url().or(z.literal("")),
  signoff: z.string().trim().max(300),
  published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
});

export type PostInput = z.infer<typeof postSchema>;

export type Post = PostInput & {
  id: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export function categoryLabel(slug: string) {
  return CATEGORIES.find((item) => item.slug === slug)?.label || "Culture";
}

/** Turn a title into a URL-safe slug, matching the existing files in posts/. */
export function slugify(title: string) {
  return title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

/** "2026-07-18" -> "Jul 18, 2026", the format used on every card and post. */
export function displayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}, ${year}`;
}

/** Blocks a post from publishing until it would actually render correctly. */
export function validateForPublish(value: PostInput) {
  if (!value.title.trim()) return "Give the post a title.";
  if (!value.dek.trim()) return "Add a short description - it appears on the blog card.";
  if (!value.body.trim()) return "The post has no body yet.";
  if (!value.cover_image_url) return "Add a cover image - the blog card needs one.";
  return null;
}
