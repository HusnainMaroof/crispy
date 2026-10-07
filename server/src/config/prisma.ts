import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { envConfig } from "./env.js";
import { logger } from "../middleware/logger.js";

/**
 * One shared client per database endpoint, created once per process.
 *
 * The app talks to Neon through the pooled URL (NEON_DATABASE_URL). The pool
 * below is the process-local pg pool behind the adapter; its ceiling is
 * `DB_POOL_MAX` per instance, so the total connection count is
 * instances x DB_POOL_MAX and should stay well under Neon's limit.
 */
let primary: PrismaClient | null = null;
let replica: PrismaClient | null = null;

/** `sslmode=require` currently means verify-full, and pg warns about that on every boot. */
function normalize(url: string): string {
  return url.replace(/\bsslmode=require\b/g, "sslmode=verify-full");
}

function poolConfig() {
  return {
    max: envConfig.NEON.POOL_MAX,
    idleTimeoutMillis: envConfig.NEON.IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: envConfig.NEON.CONNECT_TIMEOUT_MS,
  };
}

/**
 * Slow-query logging at the driver pool, timed around every SQL statement.
 * Off unless SLOW_QUERY_MS is set, so production keeps quiet logs; set it
 * (for example to 200) when hunting regressions. Prisma 7's client engine
 * exposes no query events, so the pg pool is the reliable place to time SQL.
 */
function instrumentedPool(connectionString: string, endpoint: string): pg.Pool {
  const pool = new pg.Pool({ connectionString, ...poolConfig() });
  const threshold = envConfig.NEON.SLOW_QUERY_MS;
  if (threshold <= 0) return pool;

  const original = pool.query.bind(pool);
  const timed = (...args: unknown[]) => {
    const started = Date.now();
    const result = (original as (...inner: unknown[]) => unknown)(...args);
    const done = () => {
      const duration = Date.now() - started;
      if (duration >= threshold) {
        const first = args[0];
        const sql = typeof first === "string"
          ? first
          : first && typeof first === "object" && "text" in first && typeof first.text === "string"
            ? first.text
            : undefined;
        logger.warn({ endpoint, duration_ms: duration, sql }, "slow query");
      }
    };
    void Promise.resolve(result).then(done, done);
    return result;
  };
  pool.query = timed as typeof pool.query;
  return pool;
}

export function getPrisma(): PrismaClient {
  const connectionString = normalize(envConfig.NEON.DATABASE_URL);
  if (!connectionString) {
    throw new Error("Missing required env variable: NEON_DATABASE_URL");
  }

  if (!primary) {
    primary = new PrismaClient({
      adapter: new PrismaPg(instrumentedPool(connectionString, "primary")),
    });
  }

  return primary;
}

/**
 * Reads that tolerate replication lag go here. With no NEON_READ_REPLICA_URL
 * configured this is exactly the primary, so behaviour is unchanged by default.
 *
 * Call sites decide what is lag-tolerant; only anonymous public reads pass the
 * "read" option. Anything after a write, in a transaction, priced, personalised
 * or admin-facing must keep using getPrisma().
 */
export function getReadPrisma(): PrismaClient {
  // Read at call time so the replica can be pointed elsewhere without a restart
  // and tests can exercise both branches of this function.
  const url = process.env.NEON_READ_REPLICA_URL || envConfig.NEON.READ_REPLICA_URL;
  if (!url) return getPrisma();

  const connectionString = normalize(url);
  if (!replica) {
    replica = new PrismaClient({
      adapter: new PrismaPg(instrumentedPool(connectionString, "replica")),
    });
  }
  return replica;
}

/** Closes both pools. Called from the graceful shutdown in index.ts. */
export async function disconnectPrisma(): Promise<void> {
  const clients = [primary, replica].filter((client): client is PrismaClient => Boolean(client));
  primary = null;
  replica = null;
  await Promise.all(clients.map((client) => client.$disconnect().catch(() => {})));
}
