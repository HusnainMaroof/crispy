CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "homepage_sections_type_check" CHECK ("type" IN ('hero', 'welcome', 'flavours', 'partner')),
    CONSTRAINT "homepage_sections_sort_order_check" CHECK ("sort_order" >= 0)
);

CREATE UNIQUE INDEX "homepage_sections_type_key" ON "homepage_sections"("type");
CREATE INDEX "homepage_sections_is_published_is_active_sort_order_idx" ON "homepage_sections"("is_published", "is_active", "sort_order");

INSERT INTO "homepage_sections" ("id", "type", "title", "description", "cta_label", "cta_url", "sort_order", "is_active", "is_published")
VALUES
    ('c13a0001-0000-4000-8000-000000000001', 'hero', E'Always Good\nMood Food', '', NULL, NULL, 0, true, true),
    ('c13a0001-0000-4000-8000-000000000002', 'welcome', '', 'Crispies was founded with a mission to serve the best burgers & chicken around. Our aim has always been to serve fresh, handmade food, bursting with flavours from around the globe.', NULL, NULL, 1, true, true),
    ('c13a0001-0000-4000-8000-000000000003', 'flavours', 'Crispies Original Flavours', '', NULL, NULL, 2, true, true),
    ('c13a0001-0000-4000-8000-000000000004', 'partner', E'Bring Crispies\nto your city.', 'Join London''s fastest-growing halal restaurant brand.', 'Become A Partner', '/franchise-inquiries', 3, true, true);
