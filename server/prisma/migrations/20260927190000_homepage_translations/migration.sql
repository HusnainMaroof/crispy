CREATE TABLE "homepage_section_translations" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "cta_label" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homepage_section_translations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "homepage_section_translations_locale_check" CHECK ("locale" IN ('en', 'ur'))
);

CREATE UNIQUE INDEX "homepage_section_translations_section_id_locale_key" ON "homepage_section_translations"("section_id", "locale");
ALTER TABLE "homepage_section_translations" ADD CONSTRAINT "homepage_section_translations_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "homepage_section_translations" ("id", "section_id", "locale", "title", "description", "image_url", "cta_label", "is_published", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", 'en', "title", "description", "image_url", "cta_label", "is_published", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "homepage_sections";

DROP INDEX IF EXISTS "homepage_sections_is_published_is_active_sort_order_idx";
ALTER TABLE "homepage_sections" DROP COLUMN "title";
ALTER TABLE "homepage_sections" DROP COLUMN "description";
ALTER TABLE "homepage_sections" DROP COLUMN "image_url";
ALTER TABLE "homepage_sections" DROP COLUMN "cta_label";
ALTER TABLE "homepage_sections" DROP COLUMN "is_published";
CREATE INDEX "homepage_sections_is_active_sort_order_idx" ON "homepage_sections"("is_active", "sort_order");
