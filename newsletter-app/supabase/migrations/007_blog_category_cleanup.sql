-- Keep introductory content outside editorial archives and retire unused categories.
-- No posts are deleted; legacy assignments move to the closest active category.
update public.blog_posts
set category = case
  when slug = 'about-chevere' then 'introduction'
  when slug = 'maybe-women-should-be-more-difficult' then 'life-wellness'
  when slug = 'my-current-obsessions' then 'pop-culture'
  when category = 'everyday-favorites' then 'pop-culture'
  when category in ('hosting', 'wellness') then 'life-wellness'
  when category = 'evergreen-guides' then 'seasonal-recommendations'
  else category
end
where category in ('everyday-favorites', 'hosting', 'wellness', 'evergreen-guides')
   or slug in (
     'about-chevere',
     'maybe-women-should-be-more-difficult',
     'my-current-obsessions'
   );
