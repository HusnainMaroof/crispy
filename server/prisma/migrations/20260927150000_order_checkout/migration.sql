ALTER TABLE "orders" ADD COLUMN "checkout_key" TEXT;
CREATE UNIQUE INDEX "orders_checkout_key_key" ON "orders"("checkout_key");

ALTER TABLE "order_items" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'product';
ALTER TABLE "order_items" ADD COLUMN "deal_id" TEXT;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
