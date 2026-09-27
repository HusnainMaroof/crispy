import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.NEON_DIRECT_URL ||
  process.env.NEON_DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
