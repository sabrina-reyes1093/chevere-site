-- One weekly-roundup record powers both the homepage and the newsletter.
-- Email delivery status remains separate because sent/sending are operational
-- states, while roundup_status controls public homepage publication.

do $$ begin
  create type public.roundup_status as enum ('draft', 'scheduled', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

alter table public.newsletter_issues
  add column if not exists issue_date date,
  add column if not exists homepage_publish_at timestamptz,
  add column if not exists roundup_status public.roundup_status not null default 'draft',
  add column if not exists roundup_items jsonb not null default '[]'::jsonb,
  add column if not exists roundup_snapshot jsonb,
  add column if not exists closing_note text not null default '',
  add column if not exists signoff text not null default 'Until next week,
Stay CHÉVERE';

update public.newsletter_issues
set issue_date = coalesce(issue_date, created_at::date)
where issue_date is null;

-- Older releases sometimes stored the recommendations array as a JSON string
-- inside jsonb. Preserve those drafts when moving to the shared roundup field.
update public.newsletter_issues
set roundup_items = case
  when jsonb_typeof(recommendations) = 'array' then recommendations
  when jsonb_typeof(recommendations) = 'string'
    and (recommendations #>> '{}') ~ '^\s*\['
    then (recommendations #>> '{}')::jsonb
  else '[]'::jsonb
end
where roundup_items = '[]'::jsonb
  and recommendations is not null;

create index if not exists newsletter_issues_homepage_roundup_idx
  on public.newsletter_issues(roundup_status, homepage_publish_at desc)
  where homepage_publish_at is not null;

create table if not exists public.newsletter_issue_snapshots (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null unique references public.newsletter_issues(id) on delete restrict,
  issue_payload jsonb not null,
  rendered_html text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.newsletter_issue_snapshots enable row level security;
revoke all on public.newsletter_issue_snapshots from anon, authenticated;
grant all on public.newsletter_issue_snapshots to service_role;
