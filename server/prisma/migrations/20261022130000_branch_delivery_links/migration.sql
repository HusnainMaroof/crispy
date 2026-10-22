-- Delivery partner links per branch. Empty falls back to the site-wide link.
ALTER TABLE "locations" ADD COLUMN "redirect_uber_eats" TEXT NOT NULL DEFAULT '';
ALTER TABLE "locations" ADD COLUMN "redirect_deliveroo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "locations" ADD COLUMN "redirect_just_eat" TEXT NOT NULL DEFAULT '';
