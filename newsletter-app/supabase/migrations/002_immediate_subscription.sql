alter table public.newsletter_subscribers
  alter column status set default 'active';

update public.newsletter_subscribers
set status = 'active',
    confirmed_at = coalesce(confirmed_at, created_at, now()),
    confirmation_token_hash = null,
    confirmation_sent_at = null,
    updated_at = now()
where status = 'pending';
