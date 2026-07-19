alter table public.newsletter_deliveries
  add column if not exists delivered_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

create index if not exists newsletter_deliveries_provider_idx
  on public.newsletter_deliveries(provider_id)
  where provider_id is not null;

create table if not exists public.newsletter_webhook_events (
  webhook_id text primary key,
  provider_id text,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_webhook_events_provider_idx
  on public.newsletter_webhook_events(provider_id, occurred_at);

alter table public.newsletter_webhook_events enable row level security;
revoke all on public.newsletter_webhook_events from anon, authenticated;
