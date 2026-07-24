import { categoryLabels } from "@/lib/post-schema";
import { createAdminClient } from "@/lib/supabase-admin";

type PublishedPostRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  dek: string;
  cover_image_url: string;
  published_on: string;
};

export type FeaturedReadArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image_url: string;
  image_alt: string;
  url: string;
  published_on: string;
};

export type FeaturedRead = FeaturedReadArticle & {
  display_order: number;
};

export function toFeaturedReadArticle(post: PublishedPostRow): FeaturedReadArticle {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: categoryLabels(post.category, post.slug),
    excerpt: post.dek,
    image_url: post.cover_image_url,
    image_alt: post.title,
    url: `/posts/${post.slug}.html`,
    published_on: post.published_on,
  };
}

export async function loadPublishedArticles() {
  const { data, error } = await createAdminClient()
    .from("blog_posts")
    .select("id,slug,title,category,dek,cover_image_url,published_on")
    .eq("status", "published")
    .neq("category", "introduction")
    .neq("slug", "about-chevere")
    .order("published_on", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as PublishedPostRow[]).map(toFeaturedReadArticle);
}

export async function loadFeaturedReads(): Promise<FeaturedRead[]> {
  const { data, error } = await createAdminClient()
    .from("homepage_featured_reads")
    .select("display_order,blog_posts!inner(id,slug,title,category,dek,cover_image_url,published_on,status)")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).flatMap((row) => {
    const relation = row.blog_posts as unknown;
    const post = (Array.isArray(relation) ? relation[0] : relation) as (PublishedPostRow & { status: string }) | null;
    if (!post || post.status !== "published") return [];
    return [{ ...toFeaturedReadArticle(post), display_order: Number(row.display_order) }];
  });
}
