import { Prisma } from "../generated/prisma/client.js";
import { BadRequestException, ConflictException, InternalServerException, NotFoundException } from "./app-error.js";
import { logger } from "../middleware/logger.js";

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

/**
 * Turns a Prisma driver error into a client-safe AppError.
 *
 * `error.message` is never forwarded: on P2003 it carries the raw Postgres
 * text, including table and column names and the generated constraint name.
 * That reached anonymous callers through POST /api/jobs/:id/apply, which
 * inserts with a caller-supplied job_post_id and has no existence check.
 * Anything unrecognised is logged and reported as a generic 500 so the cause
 * stays diagnosable server-side without leaking it to the client.
 */
export function rethrow(error: unknown, missing: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        throw new NotFoundException(missing);
      case "P2002":
        throw new ConflictException("That record already exists");
      case "P2003":
        throw new NotFoundException(missing);
      case "P2014":
        throw new BadRequestException("This change would break a linked record");
      default:
        logger.error({ err: error, code: error.code }, "Unhandled Prisma request error");
        throw new InternalServerException();
    }
  }
  throw error;
}
