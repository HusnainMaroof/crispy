import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { envConfig } from "./env.js";

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  const connectionString = envConfig.NEON.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing required env variable: NEON_DATABASE_URL");
  }

  if (!prisma) {
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
}
