-- Seed: the original demo-day events, now as real database rows.
-- Prerequisites: run 20261027170000_sprint11_event_images.sql first (adds
-- events.image_object_key), and confirm the cover image was uploaded to the
-- public R2 bucket at events/e7e60000-0000-4000-8000-000000000001.jpg.
-- All events are seeded as published so the public calendar shows them
-- immediately. Idempotent: re-running updates the same rows in place.
-- Apply through the Supabase Dashboard SQL Editor after reviewing this file.

-- Free the spotlight slot before seeding so the seed cannot collide with the
-- single-spotlight unique index.
update public.events
set is_spotlight = false
where is_spotlight;

insert into public.events (
  id, title, description, category, location, starts_at, ends_at,
  status, is_spotlight, image_object_key, created_at
) values
  (
    'e7e60000-0000-4000-8000-000000000001',
    'American Football Demo Day',
    'Experience American football at a live Demo Day for athletes, coaches, and fans.',
    'American football demo',
    'University of Ghana Rugby Stadium',
    '2026-11-14T09:00:00Z',
    null,
    'published',
    true,
    'events/e7e60000-0000-4000-8000-000000000001.jpg',
    '2026-10-01T09:00:00Z'
  ),
  (
    'e7e60000-0000-4000-8000-000000000002',
    'Women in Sport: Open House',
    'A conversation and connection session for the next generation.',
    'Community',
    'Community Arena',
    '2026-11-28T14:00:00Z',
    null,
    'published',
    false,
    null,
    '2026-10-01T09:00:00Z'
  ),
  (
    'e7e60000-0000-4000-8000-000000000003',
    'Demo Day Network Social',
    'Meet the coaches, scouts, guardians, and athletes moving the game forward.',
    'Network',
    'The Green Room',
    '2026-12-12T18:30:00Z',
    null,
    'published',
    false,
    null,
    '2026-10-01T09:00:00Z'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  location = excluded.location,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  is_spotlight = excluded.is_spotlight,
  image_object_key = excluded.image_object_key;
