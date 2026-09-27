import { Prisma } from "../generated/prisma/client.js";
import { BadRequestException, NotFoundException } from "./app-error.js";

export function serialize<T>(value: unknown): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (isDecimal(value)) return value.toNumber();
    if (Array.isArray(value)) return value.map(walk);
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = walk(nested);
    }
    return out;
  }
  return value;
}

function isDecimal(value: object): value is { toNumber: () => number } {
  return value.constructor?.name?.startsWith("Decimal") === true && "toNumber" in value && typeof value.toNumber === "function";
}

export function rethrow(error: unknown, missing: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") throw new NotFoundException(missing);
    throw new BadRequestException(error.message);
  }
  throw error;
}
