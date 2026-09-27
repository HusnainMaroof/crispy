-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "city" TEXT,
ADD COLUMN     "collection_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "delivery_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "delivery_fee" DECIMAL(10,2),
ADD COLUMN     "free_delivery_threshold" DECIMAL(10,2),
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "branch_menu_items" (
    "id" BIGSERIAL NOT NULL,
    "location_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_deals" (
    "id" BIGSERIAL NOT NULL,
    "location_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_branch_access" (
    "admin_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_branch_access_pkey" PRIMARY KEY ("admin_id","location_id")
);

-- CreateIndex
CREATE INDEX "branch_menu_items_location_id_available_idx" ON "branch_menu_items"("location_id", "available");

-- CreateIndex
CREATE UNIQUE INDEX "branch_menu_items_location_id_menu_item_id_key" ON "branch_menu_items"("location_id", "menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_deals_location_id_deal_id_key" ON "branch_deals"("location_id", "deal_id");

-- AddForeignKey
ALTER TABLE "branch_menu_items" ADD CONSTRAINT "branch_menu_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_menu_items" ADD CONSTRAINT "branch_menu_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_deals" ADD CONSTRAINT "branch_deals_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_deals" ADD CONSTRAINT "branch_deals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_branch_access" ADD CONSTRAINT "admin_branch_access_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_branch_access" ADD CONSTRAINT "admin_branch_access_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill slugs from branch names. Do not suffix collisions.
UPDATE "locations"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

DO $$
DECLARE
  collisions text;
BEGIN
  SELECT string_agg(slug || ' x' || cnt::text, ', ')
  INTO collisions
  FROM (
    SELECT slug, COUNT(*) AS cnt
    FROM "locations"
    WHERE slug IS NOT NULL AND slug <> ''
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) duplicated;

  IF collisions IS NOT NULL THEN
    RAISE EXCEPTION 'location slug collision: %', collisions;
  END IF;

  IF EXISTS (SELECT 1 FROM "locations" WHERE slug IS NULL OR slug = '') THEN
    RAISE EXCEPTION 'location slug backfill left an empty slug';
  END IF;
END $$;

CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- Inherited price: NULL means use menu_items.price. Only active catalogue rows.
INSERT INTO "branch_menu_items" ("location_id", "menu_item_id", "price", "available", "created_at", "updated_at")
SELECT l."id", m."id", NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "locations" l
CROSS JOIN "menu_items" m
WHERE l."status" = 'active' AND m."active" = true;

INSERT INTO "branch_deals" ("location_id", "deal_id", "price", "available", "created_at", "updated_at")
SELECT l."id", d."id", NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "locations" l
CROSS JOIN "deals" d
WHERE l."status" = 'active' AND d."active" = true;
