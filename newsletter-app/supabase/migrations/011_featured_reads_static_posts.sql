-- Existing Chévere articles predate the blog_posts table, so Featured Reads
-- references the canonical published article slug instead of requiring a
-- duplicate database row for every static article.

alter table public.homepage_featured_reads
  add column if not exists post_slug text;

do $$ begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'homepage_featured_reads'
      and column_name = 'post_id'
  ) then
    update public.homepage_featured_reads as featured
    set post_slug = posts.slug
    from public.blog_posts as posts
    where posts.id = featured.post_id
      and featured.post_slug is null;
  end if;
end $$;

alter table public.homepage_featured_reads
  drop constraint if exists homepage_featured_reads_unique_post;

alter table public.homepage_featured_reads
  drop constraint if exists homepage_featured_reads_post_id_fkey;

alter table public.homepage_featured_reads
  drop column if exists post_id;

insert into public.homepage_featured_reads (display_order, post_slug)
values
  (1, 'maybe-women-should-be-more-difficult'),
  (2, 'chevere-summer-reading-edit'),
  (3, 'spain-wins-the-2026-world-cup')
on conflict (display_order) do update
set post_slug = excluded.post_slug,
    updated_at = now(),
    updated_by = null;

alter table public.homepage_featured_reads
  alter column post_slug set not null;

do $$ begin
  alter table public.homepage_featured_reads
    add constraint homepage_featured_reads_unique_slug unique (post_slug)
    deferrable initially deferred;
exception
  when duplicate_object then null;
end $$;
