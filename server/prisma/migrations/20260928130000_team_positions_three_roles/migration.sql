ALTER TABLE "admin_profiles" ADD COLUMN "position" TEXT;

-- Existing accounts keep their identities and branch assignments. Unassigned
-- managers have an empty branch scope until the owner assigns a branch.
UPDATE "admin_profiles" AS p SET "is_active" = FALSE
WHERE p."role" = 'admin' AND NOT EXISTS (
  SELECT 1 FROM "admin_branch_access" AS access WHERE access."admin_id" = p."id"
);

UPDATE "admin_profiles" SET "role" = 'branch_manager'
WHERE "role" IN ('admin', 'branch_admin');

UPDATE "admin_profiles" AS p SET "tabs" = ARRAY(
  SELECT t FROM unnest(p."tabs") AS t
  WHERE t = ANY(CASE WHEN p."role" = 'branch_manager'
    THEN ARRAY['dashboard','orders','customers','menu','branch-menu','staff']
    ELSE ARRAY['dashboard','orders','customers','menu','branch-menu'] END)
) WHERE "role" IN ('branch_manager', 'staff');

ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_role_check"
CHECK ("role" IN ('superadmin', 'branch_manager', 'staff'));
