-- Admin session revocation: a per-account version that is embedded in each JWT.
ALTER TABLE "admin_profiles" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
