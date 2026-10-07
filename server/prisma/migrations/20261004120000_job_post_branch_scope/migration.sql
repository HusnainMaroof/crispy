-- Branch-scoped job posts.
--
-- `job_posts.location` was free text ("Brixton", "Stratford") and matched no
-- branch row, so a post could not be filtered by branch or permission-checked
-- at all. `location_id` is the real relation.
--
-- It stays NULLABLE with ON DELETE SET NULL, following the `orders.location_id`
-- precedent. Rows written before this migration keep their existing text label,
-- and a post whose branch is later removed is unbound rather than deleted with
-- the branch. Branch-scoped reads filter `location_id IN (...)`, so unbound
-- rows are visible to super admins only, which is the safe default.

-- AlterTable
ALTER TABLE "job_posts" ADD COLUMN "location_id" TEXT;

-- CreateIndex
CREATE INDEX "job_posts_location_id_created_at_idx" ON "job_posts"("location_id", "created_at");

-- The create/edit form suggests every type already in use rather than a fixed
-- enum, so this column is read as a distinct set.
CREATE INDEX "job_posts_type_idx" ON "job_posts"("type");

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill by branch name, matched loosely because the seed data used
-- short labels ("Brixton", "Stratford") that match no branch row at all.
UPDATE "job_posts" jp
SET "location_id" = l."id"
FROM "locations" l
WHERE jp."location_id" IS NULL
  AND lower(l."name") = lower(jp."location");

-- Anything still unbound names a branch that does not exist. It also cannot be
-- managed by a branch-scoped admin, since those only see their own branches.
-- Leaving it active would put a post for a non-existent branch on the public
-- careers page, so it is pulled back to draft for someone to re-assign.
UPDATE "job_posts"
SET "status" = 'draft'
WHERE "location_id" IS NULL
  AND "status" = 'active';

-- Grant the Job Posts tab to existing branch managers.
--
-- `resolveTabs` prefers the tabs stored on the account and only narrows them,
-- so widening the MANAGER_TABS allow-list does nothing for an account that was
-- already saved. Without this, every current manager keeps the old tab set and
-- the jobs routes answer 403 for them.
UPDATE "admin_profiles"
SET "tabs" = array_append("tabs", 'posts')
WHERE "role" = 'branch_manager'
  AND NOT ('posts' = ANY("tabs"));