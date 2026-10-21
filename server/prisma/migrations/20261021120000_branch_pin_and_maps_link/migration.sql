-- Manual pin number shown on the store location list and map marker.
-- Null means the branch falls back to its position in the ordered list.
ALTER TABLE "locations" ADD COLUMN "pin_number" INTEGER;

-- Google Maps link pasted in the branch form. Empty means the storefront
-- builds a link from lat/lng, or from the address when coordinates are missing.
ALTER TABLE "locations" ADD COLUMN "google_maps_url" TEXT NOT NULL DEFAULT '';
