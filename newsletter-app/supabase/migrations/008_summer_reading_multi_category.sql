-- One post can appear in multiple archives without duplicating its database row
-- or published article. Category slugs are stored as a comma-separated list in
-- the existing text column for backward compatibility.
update public.blog_posts
set category = 'books,reading-lists', updated_at = now()
where slug = 'chevere-summer-reading-edit';
