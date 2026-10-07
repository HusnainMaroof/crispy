/**
 * Small cache for anonymous, non-personalized, read-only public data.
 *
 * NEVER cache: quotes, orders, customers, anything keyed to crispy_customer_id,
 * auth/session data, admin responses, or the checkout path.
 *
 * In-process LRU by default. With CACHE_REDIS_URL (+ CACHE_REDIS_TOKEN) set, a
 * shared Upstash-style REST backend is used so several server instances share
 * one cache. With only the in-process cache each instance has its own copy:
 * TTLs stay short (a minute or two), so the staleness window is bounded by the
 * TTL even when an invalidation on one instance does not reach the others.
 */
import { logger } from "../middleware/logger.js";

export interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
}

type Entry = { value: string; expiresAt: number };

/** Insertion-ordered Map with expiry checks; oldest entries evicted first. */
export class LruCache implements CacheBackend {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly maxEntries = 500) {}

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    // Touch so a hot key is not the next eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.entries.has(key)) this.entries.delete(key);
    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
    const ttlMs = ttlSeconds > 0 ? ttlSeconds * 1000 : -1;
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of [...this.entries.keys()]) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }
}

/** Upstash-style REST Redis: GET / set / DEL / SCAN for prefixes. */
class RedisRestCache implements CacheBackend {
  constructor(
    private readonly base: string,
    private readonly token: string,
  ) {}

  private async call(command: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.base, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`cache redis error ${res.status}`);
    const body = (await res.json()) as { result?: unknown };
    return body.result ?? null;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.call(["GET", key]);
    return typeof result === "string" ? result : null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.call(["SET", key, value, "EX", ttlSeconds]);
  }

  async del(key: string): Promise<void> {
    await this.call(["DEL", key]);
  }

  async delByPrefix(prefix: string): Promise<void> {
    let cursor = "0";
    do {
      const result = (await this.call(["SCAN", cursor, "MATCH", `${prefix}*`, "COUNT", 200])) as [
        string,
        string[],
      ];
      cursor = result[0];
      if (result[1].length > 0) await this.call(["DEL", ...result[1]]);
    } while (cursor !== "0");
  }
}

let backend: CacheBackend | null = null;

function resolveBackend(): CacheBackend {
  const url = process.env.CACHE_REDIS_URL;
  const token = process.env.CACHE_REDIS_TOKEN;
  if (url && token) return new RedisRestCache(url, token);
  return new LruCache();
}

export function getCache(): CacheBackend {
  if (!backend) backend = resolveBackend();
  return backend;
}

/** Test seam, and the way a custom backend is installed at boot. */
export function setCacheBackend(next: CacheBackend | null): void {
  backend = next;
  inflight.clear();
}

/**
 * One in-flight load per key. A burst of cache misses must not each hit Postgres.
 * `generations` stops a load that started before an invalidation from writing
 * the old value back after `del` / `delByPrefix`.
 */
const inflight = new Map<string, Promise<unknown>>();
const generations = new Map<string, number>();

function generation(key: string): string {
  const parts: string[] = [];
  for (const [prefix, gen] of generations) {
    if (key === prefix || key.startsWith(prefix)) parts.push(`${prefix}:${gen}`);
  }
  return parts.join(",");
}

function bump(prefix: string): void {
  generations.set(prefix, (generations.get(prefix) ?? 0) + 1);
}

/**
 * Read-through helper. A cache failure never breaks a request: it falls back to
 * the loader, and a failed write-through is swallowed.
 */
export function cachedJson<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  // Captured before any await so an invalidation during the load cannot be
  // overwritten by this fill.
  const seen = generation(key);
  const request = (async () => {
    try {
      const hit = await getCache().get(key);
      if (hit !== null) {
        logger.debug({ key, hit: true }, "cache");
        return JSON.parse(hit) as T;
      }
    } catch {
      /* treat as a miss */
    }

    logger.info({ key, hit: false }, "cache fill");
    const value = await load();
    if (generation(key) === seen) {
      await getCache().set(key, JSON.stringify(value), ttlSeconds).catch(() => {});
    }
    return value;
  })();

  inflight.set(key, request);
  return request.finally(() => {
    if (inflight.get(key) === request) inflight.delete(key);
  });
}

// TTLs: catalogue and jobs change rarely and are display-only (the server
// re-prices every order line), so 60s bounds staleness without making admin
// edits feel invisible. Settings and CMS copy change even less often: 120s.
export const TTL_MENU_SECONDS = 60;
export const TTL_LOCATIONS_SECONDS = 60;
export const TTL_JOBS_SECONDS = 60;
export const TTL_SETTINGS_SECONDS = 120;
export const TTL_CMS_SECONDS = 120;

async function fire(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch {
    /* invalidation is best-effort; the TTL is the safety bound */
  }
}

/** Menu items, categories, and deals changed. */
export function invalidateCatalogueCache(): Promise<void> {
  bump("menu:");
  bump("deals:");
  return fire(async () => {
    await getCache().delByPrefix("menu:");
    await getCache().delByPrefix("deals:");
  });
}

/** A branch row changed (create, update, deactivate). */
export function invalidateLocationsCache(): Promise<void> {
  bump("locations:");
  return fire(() => getCache().delByPrefix("locations:"));
}

/** business_settings changed. */
export function invalidateSettingsCache(): Promise<void> {
  bump("settings");
  return fire(() => getCache().del("settings"));
}

/** A CMS section was patched, moved, or reset. */
export function invalidateCmsCache(): Promise<void> {
  bump("cms:");
  return fire(() => getCache().delByPrefix("cms:"));
}

/** A public job post changed. */
export function invalidateJobsCache(): Promise<void> {
  bump("jobs:public:");
  return fire(() => getCache().delByPrefix("jobs:public:"));
}
