-- Toggle in the admin menu form. False hides the price on the store menu.
-- Existing items keep showing their price.
ALTER TABLE "menu_items" ADD COLUMN "show_price" BOOLEAN NOT NULL DEFAULT true;
