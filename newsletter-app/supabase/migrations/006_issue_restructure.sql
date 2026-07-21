-- Migration 006: Restructure newsletter issues to 4-section format
-- Adds roundup_items (jsonb), closing_note, signoff columns
-- Migrates old data from recommendations, obsessed_*, weekend_*, last_thing into new shape
-- Old columns are kept for backward compatibility but nullable

alter table public.newsletter_issues
  add column if not exists roundup_items jsonb not null default '[]'::jsonb,
  add column if not exists closing_note text not null default '',
  add column if not exists signoff text not null default 'Until next week,
Sabrina';

-- Migrate existing rows: convert old section data into roundup_items
update public.newsletter_issues set
  roundup_items = coalesce(
    (
      select jsonb_agg(item) from (
        select jsonb_build_object('category', 'Currently Obsessed', 'title', obsessed_title, 'text', obsessed_text, 'url', obsessed_url, 'image_url', '') as item
        where obsessed_title <> ''
        union all
        select jsonb_build_object('category', 'For the Weekend', 'title', weekend_title, 'text', weekend_text, 'url', weekend_url, 'image_url', '') as item
        where weekend_title <> ''
        union all
        select jsonb_build_object('category', 'Worth Discovering', 'title', rec->>'title', 'text', rec->>'text', 'url', rec->>'url', 'image_url', coalesce(rec->>'image_url', '')) as item
        from jsonb_array_elements(recommendations) as rec
        where rec->>'title' <> ''
      ) as items
    ),
    '[]'::jsonb
  )
  where roundup_items = '[]'::jsonb;

-- Migrate last_thing into closing_note
update public.newsletter_issues set closing_note = last_thing where closing_note = '' and last_thing <> '';

-- Make old columns nullable so they don't block saves with the new schema
alter table public.newsletter_issues
  alter column note_from_sabrina drop not null,
  alter column recommendations drop not null,
  alter column featured_title drop not null,
  alter column featured_preview drop not null,
  alter column featured_url drop not null,
  alter column featured_image_url drop not null,
  alter column obsessed_title drop not null,
  alter column obsessed_text drop not null,
  alter column obsessed_url drop not null,
  alter column weekend_title drop not null,
  alter column weekend_text drop not null,
  alter column weekend_url drop not null,
  alter column last_thing drop not null;

-- Set defaults to empty string for old columns so new saves don't fail
alter table public.newsletter_issues
  alter column note_from_sabrina set default '',
  alter column recommendations set default '[]'::jsonb,
  alter column featured_title set default '',
  alter column featured_preview set default '',
  alter column featured_url set default '',
  alter column featured_image_url set default '',
  alter column obsessed_title set default '',
  alter column obsessed_text set default '',
  alter column obsessed_url set default '',
  alter column weekend_title set default '',
  alter column weekend_text set default '',
  alter column weekend_url set default '',
  alter column last_thing set default '';