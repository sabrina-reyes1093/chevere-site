-- Move existing blog posts into the July 2026 four-section taxonomy.
update public.blog_posts
set category = case
  when slug = 'chevere-summer-reading-edit' then 'reading-lists'
  when slug = 'best-chicago-patios-2026' then 'restaurant-roundups'
  when slug = 'my-current-obsessions' then 'everyday-favorites'
  when slug = 'dua-lipa-vacation' then 'travel'
  when category = 'tv-film' then 'film-tv'
  when category = 'food-drink' then 'food'
  when category = 'culture' then 'pop-culture'
  else category
end
where category in ('tv-film', 'food-drink', 'culture')
   or slug in (
     'chevere-summer-reading-edit',
     'best-chicago-patios-2026',
     'my-current-obsessions',
     'dua-lipa-vacation'
   );
