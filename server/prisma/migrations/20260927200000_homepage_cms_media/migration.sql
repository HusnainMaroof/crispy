ALTER TABLE "homepage_sections" DROP CONSTRAINT IF EXISTS "homepage_sections_type_check";
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_type_check"
  CHECK ("type" IN ('hero', 'welcome', 'flavours', 'partner', 'instagram', 'locations', 'ordering'));

ALTER TABLE "homepage_section_translations"
  ADD COLUMN IF NOT EXISTS "content" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "homepage_section_translations" AS translation
SET "content" = translation."content" || '{"videoUrl":"/images/herobgvideo.mp4"}'::jsonb
FROM "homepage_sections" AS section
WHERE translation."section_id" = section."id"
  AND section."type" = 'hero'
  AND translation."locale" = 'en';

UPDATE "homepage_section_translations" AS translation
SET "content" = translation."content" || '{"discoverTitle":"Discover Your Crispy Flavor","galleryImages":["/images/aboutimage.jpg","/images/aboutimage.jpg","/images/aboutimage.jpg","/images/aboutimage.jpg"],"ctaLabel":"Order On The Website","ctaUrl":"/menu"}'::jsonb
FROM "homepage_sections" AS section
WHERE translation."section_id" = section."id"
  AND section."type" = 'flavours'
  AND translation."locale" = 'en';

INSERT INTO "homepage_sections" ("id", "type", "cta_url", "sort_order", "is_active", "created_at", "updated_at")
VALUES
  ('c13a0001-0000-4000-8000-000000000005', 'instagram', NULL, 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c13a0001-0000-4000-8000-000000000006', 'locations', '/locations', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c13a0001-0000-4000-8000-000000000007', 'ordering', NULL, 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO NOTHING;

INSERT INTO "homepage_section_translations" ("id", "section_id", "locale", "title", "description", "image_url", "cta_label", "content", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid()::text, section."id", 'en', 'Instagram', '', NULL, 'Follow',
  '{"username":"crispiesuk","profileUrl":"https://www.instagram.com/crispiesuk","posts":"557","followers":"16.1k","following":"19","bio":"Good Mood Food 🍔🍟","reels":[{"url":"https://www.instagram.com/reel/DXohuMwDTw3/","thumbnailUrl":"/images/heroimage.png","likes":"","views":""},{"url":"https://www.instagram.com/reel/DcgNQ9xNZzU/","thumbnailUrl":"/images/aboutimage.jpg","likes":"","views":""},{"url":"https://www.instagram.com/reel/DcA2VEfs3cf/","thumbnailUrl":"/images/frienchies.png","likes":"","views":""},{"url":"https://www.instagram.com/reel/DbYdlyNNaRR/","thumbnailUrl":"/images/partnerImages.jpg","likes":"","views":""},{"url":"https://www.instagram.com/reel/DauQEe8NqlT/","thumbnailUrl":"/images/heroimage.png","likes":"","views":""},{"url":"https://www.instagram.com/reel/DZzxwhstJp6/","thumbnailUrl":"/images/aboutimage.jpg","likes":"","views":""},{"url":"https://www.instagram.com/reel/DXRFf4nCidl/","thumbnailUrl":"/images/frienchies.png","likes":"","views":""},{"url":"https://www.instagram.com/reel/CjatkkYjtRf/","thumbnailUrl":"/images/partnerImages.jpg","likes":"","views":""}]}'::jsonb,
  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "homepage_sections" AS section
WHERE section."type" = 'instagram'
ON CONFLICT ("section_id", "locale") DO NOTHING;

INSERT INTO "homepage_section_translations" ("id", "section_id", "locale", "title", "description", "image_url", "cta_label", "content", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid()::text, section."id", 'en', 'Find Your Nearest Crispies', '', NULL,
  'View All 10+ Locations', '{"displayMode":"cards","cardLimit":5}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "homepage_sections" AS section
WHERE section."type" = 'locations'
ON CONFLICT ("section_id", "locale") DO NOTHING;

INSERT INTO "homepage_section_translations" ("id", "section_id", "locale", "title", "description", "image_url", "cta_label", "content", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid()::text, section."id", 'en', 'Order Now', '', NULL, NULL,
  '{"mode":"cart","redirectUrl":"","ctaLabel":"Order Now"}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "homepage_sections" AS section
WHERE section."type" = 'ordering'
ON CONFLICT ("section_id", "locale") DO NOTHING;
