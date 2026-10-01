import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { envConfig } from "./env.js";

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  // `sslmode=require` currently means verify-full, and pg warns about that on
  // every boot. Pin the mode we already rely on so production logs stay quiet.
  const connectionString = envConfig.NEON.DATABASE_URL.replace(/\bsslmode=require\b/g, "sslmode=verify-full");
  if (!connectionString) {
    throw new Error("Missing required env variable: NEON_DATABASE_URL");
  }

  if (!prisma) {
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
}
