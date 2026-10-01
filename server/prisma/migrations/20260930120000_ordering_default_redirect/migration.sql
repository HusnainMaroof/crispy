-- The storefront default is the redirect system. Rows still on the original
-- seeded cart value (no custom links) move with that default. A cart setup
-- that already has its own links is left alone.
UPDATE "cms_section_translations" AS translation
SET "content" = jsonb_set(translation."content", '{mode}', '"redirect"'::jsonb)
FROM "cms_sections" AS section
WHERE translation."section_id" = section."id"
  AND section."page" = 'site'
  AND section."key" = 'ordering'
  AND translation."content"->>'mode' = 'cart'
  AND COALESCE(translation."content"->>'redirectUrl', '') = ''
  AND COALESCE(translation."content"->>'uberEatsUrl', '') = ''
  AND COALESCE(translation."content"->>'deliverooUrl', '') = ''
  AND COALESCE(translation."content"->>'justEatUrl', '') = '';
