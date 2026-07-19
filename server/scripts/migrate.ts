import { config } from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in .env");
  console.error("Set DATABASE_URL to your Supabase PostgreSQL connection string, e.g.:");
  console.error("  postgresql://postgres.your-project:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres");
  process.exit(1);
}

// Use the connection string directly for migrations (bypasses Supabase RPC limitations)
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const migrationsDir = join(__dirname, "..", "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No migration files found in", migrationsDir);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sqlPath = join(migrationsDir, file);
      const sql = readFileSync(sqlPath, "utf-8");

      console.log(`Running ${file}...`);
      try {
        await client.query(sql);
        console.log(`  ${file} completed.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Migration ${file} failed:`, message);
        console.log("Tip: Run the SQL manually in Supabase SQL Editor at:");
        console.log(`  ${databaseUrl}/project/default/sql/new`);
        console.log("\nFile:", sqlPath);
        process.exit(1);
      }
    }
    console.log("\nAll migrations completed successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration runner error:", err);
  process.exit(1);
});
