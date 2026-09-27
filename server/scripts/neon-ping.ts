import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

function databaseHost(connectionString: string): string {
  try {
    return new URL(connectionString).host;
  } catch {
    return "unknown-host";
  }
}

async function main() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("NEON_DATABASE_URL is not set in server/.env");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const rows = await prisma.$queryRaw<{ ok: number }[]>`select 1 as ok`;
    const ok = rows[0]?.ok;
    if (Number(ok) !== 1) {
      throw new Error("Unexpected result from Neon");
    }
    console.log(`Neon connection ok (${databaseHost(connectionString)})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Neon connection failed: ${message}`);
  process.exit(1);
});
