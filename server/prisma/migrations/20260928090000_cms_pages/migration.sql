-- Fold the fixed translation columns into the per-section content document.
UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_build_object('lines', (
  SELECT COALESCE(jsonb_agg(btrim(line)), '[]'::jsonb)
  FROM unnest(string_to_array(t."title", E'\n')) AS line
  WHERE btrim(line) <> ''
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'hero' AND btrim(t."title") <> '';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_build_object('description', t."description")
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'welcome' AND btrim(t."description") <> '';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_build_object('title', t."title")
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'flavours' AND btrim(t."title") <> '';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_build_object('flavours', (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', l.value,
    'image', COALESCE(t."content"->'flavourTileImages'->>((l.ord - 1)::int), '')
  ) ORDER BY l.ord), '[]'::jsonb)
  FROM jsonb_array_elements_text(t."content"->'flavourLabels') WITH ORDINALITY AS l(value, ord)
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'flavours' AND jsonb_typeof(t."content"->'flavourLabels') = 'array';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_build_object('scale', (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', l.value,
    'image', COALESCE(t."content"->'scaleImages'->>((l.ord - 1)::int), '')
  ) ORDER BY l.ord), '[]'::jsonb)
  FROM jsonb_array_elements_text(t."content"->'scaleLabels') WITH ORDINALITY AS l(value, ord)
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'flavours' AND jsonb_typeof(t."content"->'scaleLabels') = 'array';

UPDATE "homepage_section_translations"
SET "content" = "content" - 'flavourLabels' - 'flavourTileImages' - 'scaleLabels' - 'scaleImages';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_strip_nulls(jsonb_build_object(
  'title', NULLIF(t."title", ''),
  'description', NULLIF(t."description", ''),
  'ctaLabel', NULLIF(t."cta_label", ''),
  'ctaUrl', NULLIF(s."cta_url", ''),
  'imageUrl', NULLIF(t."image_url", '')
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'partner';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_strip_nulls(jsonb_build_object(
  'title', NULLIF(t."title", ''),
  'followLabel', NULLIF(t."cta_label", '')
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'instagram';

UPDATE "homepage_section_translations" AS t
SET "content" = t."content" || jsonb_strip_nulls(jsonb_build_object(
  'title', NULLIF(t."title", ''),
  'ctaLabel', NULLIF(t."cta_label", ''),
  'ctaUrl', NULLIF(s."cta_url", '')
))
FROM "homepage_sections" AS s
WHERE t."section_id" = s."id" AND s."type" = 'locations';

-- Sections become page-scoped.
ALTER TABLE "homepage_sections" RENAME TO "cms_sections";
ALTER TABLE "cms_sections" RENAME CONSTRAINT "homepage_sections_pkey" TO "cms_sections_pkey";
ALTER TABLE "cms_sections" RENAME CONSTRAINT "homepage_sections_sort_order_check" TO "cms_sections_sort_order_check";
ALTER TABLE "cms_sections" DROP CONSTRAINT IF EXISTS "homepage_sections_type_check";
DROP INDEX IF EXISTS "homepage_sections_type_key";
DROP INDEX IF EXISTS "homepage_sections_is_active_sort_order_idx";
ALTER TABLE "cms_sections" RENAME COLUMN "type" TO "key";
ALTER TABLE "cms_sections" ADD COLUMN "page" TEXT NOT NULL DEFAULT 'home';
UPDATE "cms_sections" SET "page" = 'site' WHERE "key" = 'ordering';
ALTER TABLE "cms_sections" ALTER COLUMN "page" DROP DEFAULT;
UPDATE "cms_sections" SET "sort_order" = CASE "key"
  WHEN 'hero' THEN 0 WHEN 'welcome' THEN 1 WHEN 'flavours' THEN 2
  WHEN 'locations' THEN 3 WHEN 'partner' THEN 4 WHEN 'instagram' THEN 5 ELSE 0 END;
ALTER TABLE "cms_sections" DROP COLUMN "cta_url";
ALTER TABLE "cms_sections" ADD CONSTRAINT "cms_sections_page_check"
  CHECK ("page" IN ('site', 'navbar', 'footer', 'home', 'menu', 'franchise', 'locations', 'delivery', 'checkout', 'orders'));
ALTER TABLE "cms_sections" ADD CONSTRAINT "cms_sections_key_check" CHECK ("key" ~ '^[a-z][a-z0-9_]{0,39}$');
CREATE UNIQUE INDEX "cms_sections_page_key_key" ON "cms_sections"("page", "key");
CREATE INDEX "cms_sections_page_is_active_sort_order_idx" ON "cms_sections"("page", "is_active", "sort_order");

ALTER TABLE "homepage_section_translations" RENAME TO "cms_section_translations";
ALTER TABLE "cms_section_translations" RENAME CONSTRAINT "homepage_section_translations_pkey" TO "cms_section_translations_pkey";
ALTER TABLE "cms_section_translations" RENAME CONSTRAINT "homepage_section_translations_locale_check" TO "cms_section_translations_locale_check";
ALTER TABLE "cms_section_translations" RENAME CONSTRAINT "homepage_section_translations_section_id_fkey" TO "cms_section_translations_section_id_fkey";
ALTER INDEX "homepage_section_translations_section_id_locale_key" RENAME TO "cms_section_translations_section_id_locale_key";
ALTER TABLE "cms_section_translations" DROP COLUMN "title";
ALTER TABLE "cms_section_translations" DROP COLUMN "description";
ALTER TABLE "cms_section_translations" DROP COLUMN "image_url";
ALTER TABLE "cms_section_translations" DROP COLUMN "cta_label";
