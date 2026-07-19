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
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const rest = sql.slice(i);

    if (!inDollar && rest.startsWith("$$")) {
      inDollar = true;
      dollarTag = "$$";
      current += "$$";
      i++;
      continue;
    }

    if (inDollar && dollarTag === "$$" && rest.startsWith("$$")) {
      inDollar = false;
      dollarTag = "";
      current += "$$";
      i++;
      continue;
    }

    if (!inDollar && /^\$[^$]*\$/.test(rest)) {
      const m = rest.match(/^\$([^$]*)\$/);
      if (m) {
        inDollar = true;
        dollarTag = m[0];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }

    if (inDollar && rest.startsWith(dollarTag)) {
      inDollar = false;
      current += dollarTag;
      i += dollarTag.length - 1;
      continue;
    }

    if (!inDollar && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      i++;
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (!/^\s*--/.test(current)) {
        current += ch;
      }
      continue;
    }

    if (ch === "-" && rest.startsWith("--")) {
      while (i < sql.length && sql[i] !== "\n") i++;
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith("--")) statements.push(trimmed);

  return statements;
}

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
  let hasError = false;

  try {
    for (const file of files) {
      const sqlPath = join(migrationsDir, file);
      const sql = readFileSync(sqlPath, "utf-8");
      const statements = splitStatements(sql);

      console.log(`Running ${file}...`);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          // Ignore "already exists" errors for idempotent re-runs
          if (
            message.includes("already exists") ||
            message.includes("duplicate key") ||
            message.includes("duplicate object")
          ) {
            continue;
          }
          console.error(`  Error in ${file}:`, message);
          console.error("  Statement (first 200 chars):", stmt.slice(0, 200));
          hasError = true;
        }
      }

      console.log(`  ${file} done.`);
    }
  } finally {
    client.release();
    await pool.end();
  }

  if (hasError) {
    console.log("\nSome statements failed — check logs above.");
    process.exit(1);
  }

  console.log("\nAll migrations completed successfully.");
}

migrate().catch((err) => {
  console.error("Migration runner error:", err);
  process.exit(1);
});
