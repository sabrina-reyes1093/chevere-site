-- Featured Reads is a manually curated homepage module. It is intentionally
-- separate from newsletter_issues so updating it cannot change the weekly
-- roundup or a sent newsletter snapshot.

create table if not exists public.homepage_featured_reads (
  display_order smallint primary key check (display_order between 1 and 3),
  post_id uuid not null references public.blog_posts(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint homepage_featured_reads_unique_post unique (post_id)
    deferrable initially deferred
);

alter table public.homepage_featured_reads enable row level security;
revoke all on public.homepage_featured_reads from anon, authenticated;
grant all on public.homepage_featured_reads to service_role;

-- Seed the requested evergreen selection. These rows remain in place until an
-- administrator deliberately publishes a replacement selection.
insert into public.homepage_featured_reads (display_order, post_id)
select seed.display_order, posts.id
from (
  values
    (1::smallint, 'maybe-women-should-be-more-difficult'),
    (2::smallint, 'chevere-summer-reading-edit'),
    (3::smallint, 'spain-wins-the-2026-world-cup')
) as seed(display_order, slug)
join public.blog_posts as posts on posts.slug = seed.slug
on conflict (display_order) do nothing;

-- Normalize the podcast card in editable issues and immutable homepage
-- roundup snapshots. Historical sent-email HTML remains unchanged.
update public.newsletter_issues as issue
set roundup_items = (
  select jsonb_agg(
    case
      when lower(card.value ->> 'title') like '%therapuss%'
        then jsonb_set(card.value, '{title}', to_jsonb('THERAPUSS by Jake Shane'::text), true)
      else card.value
    end
    order by card.ordinality
  )
  from jsonb_array_elements(issue.roundup_items) with ordinality as card(value, ordinality)
)
where jsonb_typeof(issue.roundup_items) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(issue.roundup_items) as card(value)
    where lower(card.value ->> 'title') like '%therapuss%'
  );

update public.newsletter_issues as issue
set roundup_snapshot = (
  select jsonb_agg(
    case
      when lower(card.value ->> 'title') like '%therapuss%'
        then jsonb_set(card.value, '{title}', to_jsonb('THERAPUSS by Jake Shane'::text), true)
      else card.value
    end
    order by card.ordinality
  )
  from jsonb_array_elements(issue.roundup_snapshot) with ordinality as card(value, ordinality)
)
where jsonb_typeof(issue.roundup_snapshot) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(issue.roundup_snapshot) as card(value)
    where lower(card.value ->> 'title') like '%therapuss%'
  );

update public.newsletter_issues as issue
set recommendations = (
  select jsonb_agg(
    case
      when lower(card.value ->> 'title') like '%therapuss%'
        then jsonb_set(card.value, '{title}', to_jsonb('THERAPUSS by Jake Shane'::text), true)
      else card.value
    end
    order by card.ordinality
  )
  from jsonb_array_elements(issue.recommendations) with ordinality as card(value, ordinality)
)
where jsonb_typeof(issue.recommendations) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(issue.recommendations) as card(value)
    where lower(card.value ->> 'title') like '%therapuss%'
  );
