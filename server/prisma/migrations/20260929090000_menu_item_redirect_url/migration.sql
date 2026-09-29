-- Per-product redirect link. When set, the Click & Collect popup sends the
-- customer here instead of the chosen platform link.
ALTER TABLE "menu_items" ADD COLUMN "redirect_url" TEXT NOT NULL DEFAULT '';
