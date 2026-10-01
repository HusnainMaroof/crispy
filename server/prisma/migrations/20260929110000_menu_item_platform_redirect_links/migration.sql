-- Per-product redirect links, one per delivery platform. The single
-- redirect_url column is replaced because the customer now picks a platform
-- first, so the destination depends on which one they chose.
--
-- Any existing redirect_url is copied into all three columns so an item that
-- had a link keeps working on every platform rather than silently losing it.
ALTER TABLE "menu_items" ADD COLUMN "redirect_uber_eats" TEXT NOT NULL DEFAULT '';
ALTER TABLE "menu_items" ADD COLUMN "redirect_deliveroo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "menu_items" ADD COLUMN "redirect_just_eat" TEXT NOT NULL DEFAULT '';

UPDATE "menu_items"
SET "redirect_uber_eats" = "redirect_url",
    "redirect_deliveroo" = "redirect_url",
    "redirect_just_eat"  = "redirect_url"
WHERE "redirect_url" <> '';

ALTER TABLE "menu_items" DROP COLUMN "redirect_url";
