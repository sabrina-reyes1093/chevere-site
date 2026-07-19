create extension if not exists citext;

create type public.subscriber_status as enum ('pending', 'active', 'unsubscribed');
create type public.issue_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');
create type public.delivery_status as enum ('pending', 'sent', 'failed');

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status public.subscriber_status not null default 'pending',
  confirmation_token_hash text,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  preview_text text not null default '',
  note_from_sabrina text not null default '',
  recommendations jsonb not null default '[]'::jsonb,
  featured_title text not null default '',
  featured_preview text not null default '',
  featured_url text not null default '',
  featured_image_url text not null default '',
  obsessed_title text not null default '',
  obsessed_text text not null default '',
  obsessed_url text not null default '',
  weekend_title text not null default '',
  weekend_text text not null default '',
  weekend_url text not null default '',
  last_thing text not null default '',
  status public.issue_status not null default 'draft',
  approved_at timestamptz,
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sent_once check ((status <> 'sent') or sent_at is not null)
);

create table public.newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.newsletter_issues(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  status public.delivery_status not null default 'pending',
  provider_id text,
  batch_number integer not null,
  attempt_count integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, subscriber_id)
);

create table public.newsletter_send_attempts (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.newsletter_issues(id) on delete set null,
  attempt_number integer not null default 0,
  result text not null,
  recipient_count integer not null default 0,
  provider_response jsonb,
  error text,
  reason text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index newsletter_subscribers_status_idx on public.newsletter_subscribers(status);
create index newsletter_issues_schedule_idx on public.newsletter_issues(status, scheduled_for);
create unique index newsletter_issues_unique_schedule_slot
  on public.newsletter_issues(scheduled_for)
  where status in ('scheduled', 'sending');
create index newsletter_deliveries_issue_status_idx on public.newsletter_deliveries(issue_id, status);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_issues enable row level security;
alter table public.newsletter_deliveries enable row level security;
alter table public.newsletter_send_attempts enable row level security;

revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.newsletter_issues from anon, authenticated;
revoke all on public.newsletter_deliveries from anon, authenticated;
revoke all on public.newsletter_send_attempts from anon, authenticated;

create or replace function public.claim_newsletter_issue(p_now timestamptz)
returns setof public.newsletter_issues
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_id uuid;
begin
  select id into selected_id
  from public.newsletter_issues
  where status = 'scheduled'
    and approved_at is not null
    and sent_at is null
    and scheduled_for <= p_now
    and scheduled_for >= p_now - interval '3 hours'
    and (next_retry_at is null or next_retry_at <= p_now)
    and attempt_count < 3
  order by scheduled_for asc
  for update skip locked
  limit 1;

  if selected_id is null then return; end if;

  return query
  update public.newsletter_issues
  set status = 'sending', attempt_count = attempt_count + 1, updated_at = p_now
  where id = selected_id and status = 'scheduled' and sent_at is null
  returning *;
end;
$$;

revoke all on function public.claim_newsletter_issue(timestamptz) from public;
grant execute on function public.claim_newsletter_issue(timestamptz) to service_role;
