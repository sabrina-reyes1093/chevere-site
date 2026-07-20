-- Blog posts are drafted here and published out as static HTML files into the
-- site repo, because the public site is served by GitHub Pages. This table is
-- the editing surface; the files on disk remain the thing readers actually get.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'culture',
  dek text not null default '',
  body text not null default '',
  cover_image_url text not null default '',
  hero_image_url text not null default '',
  signoff text not null default '',
  published_on date not null default current_date,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists blog_posts_status_idx on public.blog_posts(status, published_on desc);

-- Only the service role touches this table, mirroring newsletter_issues.
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
