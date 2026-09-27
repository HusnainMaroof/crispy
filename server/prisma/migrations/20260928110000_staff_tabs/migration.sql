ALTER TABLE "admin_profiles" ADD COLUMN "tabs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "admin_profiles"
SET "tabs" = ARRAY[
  'dashboard', 'menu', 'categories', 'orders', 'customers', 'staff', 'branches',
  'deals', 'branch-menu', 'posts', 'locations', 'content', 'settings'
]
WHERE "role" IN ('superadmin', 'admin');

UPDATE "admin_profiles"
SET "tabs" = ARRAY['dashboard', 'orders', 'customers', 'branch-menu']
WHERE "role" = 'branch_manager';
