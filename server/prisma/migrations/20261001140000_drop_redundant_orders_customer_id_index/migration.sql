-- Drop the single-column customer index.
--
-- orders_customer_id_created_at_idx leads with customer_id, so equality
-- lookups for a customer's orders already use that index. Keeping both
-- indexes only adds a write on every order.
--
-- No other index is changed.

-- DropIndex
DROP INDEX "public"."orders_customer_id_idx";
