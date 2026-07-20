-- Images pasted, dropped, or uploaded into an issue live here and are referenced
-- from the email by absolute URL. The bucket must stay public: email clients
-- fetch images anonymously and cannot present Supabase credentials, and inline
-- base64 data URIs are stripped by Gmail and Outlook.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'newsletter-images',
  'newsletter-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Reads are public so inboxes can load the images. Writes are intentionally
-- omitted: uploads run through the service role in /api/admin/upload, which
-- bypasses row level security, so no anon or authenticated insert policy exists.
drop policy if exists "newsletter images are readable" on storage.objects;
create policy "newsletter images are readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'newsletter-images');
