import { config } from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function migrate() {
  const sqlPath = join(__dirname, "..", "supabase", "migrations", "001_initial_schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("Running migration...");
  const { error } = await supabase.rpc("exec_sql", { sql });

  if (error) {
    console.error("Migration failed:", error.message);
    console.log("Tip: Run the SQL manually in Supabase SQL Editor at:");
    console.log(`  ${supabaseUrl}/project/default/sql/new`);
    console.log("\nFile:", sqlPath);
    process.exit(1);
  }

  console.log("Migration completed successfully.");
}

migrate();
