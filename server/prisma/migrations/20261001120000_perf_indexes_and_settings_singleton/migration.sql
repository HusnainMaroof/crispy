-- Composite indexes for the paginated list queries.
--
-- Every one of these is additive. No column is dropped, renamed or retyped,
-- and no existing row is rewritten.
--
-- Plain CREATE INDEX rather than CONCURRENTLY: Prisma runs each migration in a
-- transaction and CONCURRENTLY cannot run inside one. orders holds one row
-- today, so the lock is not a concern, and it will only ever be held for the
-- few milliseconds an index build takes on this table.

-- CreateIndex
CREATE INDEX "orders_location_id_created_at_idx" ON "public"."orders"("location_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "public"."orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_customer_id_created_at_idx" ON "public"."orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "customers_created_at_id_idx" ON "public"."customers"("created_at", "id");

-- CreateIndex
CREATE INDEX "admin_branch_access_location_id_idx" ON "public"."admin_branch_access"("location_id");

-- CreateIndex
CREATE INDEX "order_items_menu_item_id_idx" ON "public"."order_items"("menu_item_id");

-- Seed the business_settings singleton.
--
-- The table was created empty, and the service read it with findFirst (which
-- threw a 500) while writing it with a hardcoded `where: { id: 1 }` (which
-- threw a 404). The service now creates the row on demand; this insert just
-- makes the existing defaults available without a first write, and matches
-- scripts/seed.ts so the admin screen opens on the same numbers.
--
-- ON CONFLICT DO NOTHING makes the migration safe to re-run, and means it is
-- also a no-op on any environment where the row already exists.
INSERT INTO "public"."business_settings" ("id", "delivery_fee", "free_delivery_threshold", "updated_at")
VALUES (1, 2.99, 20.00, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
