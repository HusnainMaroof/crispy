-- Performance indexes for query shapes that already run in the code
-- (see docs/db-optimization.md, Phase 0).
--
-- Prisma applies each migration inside a transaction, so CREATE INDEX
-- CONCURRENTLY cannot be used in a migration file. These tables are small
-- (nine branches, one brand), so a plain CREATE INDEX takes a brief lock and
-- is safe here. If a table has grown large before this is applied, create the
-- same index manually with CREATE INDEX CONCURRENTLY and mark this migration
-- as applied instead.

-- getDeals (public + admin): WHERE location_id = ? AND available = true.
CREATE INDEX IF NOT EXISTS "branch_deals_location_id_available_idx"
  ON "branch_deals"("location_id", "available");

-- Admin job list: WHERE location_id IN (...) AND status = ...
CREATE INDEX IF NOT EXISTS "job_posts_location_id_status_idx"
  ON "job_posts"("location_id", "status");

-- Applications list: WHERE job_post_id = ? AND status = ...
CREATE INDEX IF NOT EXISTS "job_applications_job_post_id_status_idx"
  ON "job_applications"("job_post_id", "status");

-- getFullMenu: items per category WHERE active ORDER BY sort_order.
-- Replaces the (category_id, active) prefix so the sort comes free.
DROP INDEX IF EXISTS "menu_items_category_id_active_idx";
CREATE INDEX IF NOT EXISTS "menu_items_category_id_active_sort_order_idx"
  ON "menu_items"("category_id", "active", "sort_order");
