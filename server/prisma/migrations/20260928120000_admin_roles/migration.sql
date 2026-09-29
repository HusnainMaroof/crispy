-- Three-panel admin model: superadmin, branch_manager, and staff.

-- Fold the legacy "branch_admin" role into "branch_manager".
UPDATE "admin_profiles"
SET "role" = 'branch_manager'
WHERE "role" = 'branch_admin';

-- Branch managers may manage team members at their own branches.
UPDATE "admin_profiles"
SET "tabs" = array_append("tabs", 'staff')
WHERE "role" = 'branch_manager'
  AND NOT ('staff' = ANY("tabs"));

-- Team members must never see the Team area.
UPDATE "admin_profiles"
SET "tabs" = array_remove("tabs", 'staff')
WHERE "role" = 'staff';

-- New accounts default to the least privileged role.
ALTER TABLE "admin_profiles" ALTER COLUMN "role" SET DEFAULT 'staff';
