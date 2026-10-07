import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import "dotenv/config";
import { catalogueCacheKey } from "../src/services/menu.service.js";
import {
  LruCache,
  cachedJson,
  getCache,
  invalidateCatalogueCache,
  invalidateJobsCache,
  invalidateLocationsCache,
  invalidateSettingsCache,
  invalidateCmsCache,
  setCacheBackend,
  type CacheBackend,
} from "../src/utils/cache.js";

/** Records every operation so tests can assert exactly what a write cleared. */
class RecordingCache implements CacheBackend {
  calls: string[] = [];
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    this.calls.push(`get ${key}`);
    return this.store.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.calls.push(`set ${key}`);
    this.store.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.calls.push(`del ${key}`);
    this.store.delete(key);
  }
  async delByPrefix(prefix: string): Promise<void> {
    this.calls.push(`delByPrefix ${prefix}`);
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

describe("cache backend", () => {
  beforeEach(() => {
    setCacheBackend(null);
  });

  it("stores, expires, and evicts like an LRU", async () => {
    const lru = new LruCache(2);
    await lru.set("a", "1", 60);
    await lru.set("b", "2", 60);
    await lru.set("c", "3", 60);
    assert.equal(await lru.get("a"), null, "oldest entry is evicted");
    assert.equal(await lru.get("b"), "2");
    assert.equal(await lru.get("c"), "3");

    await lru.set("d", "4", 0);
    assert.equal(await lru.get("d"), null, "zero ttl expires immediately");
  });

  it("deletes by prefix without touching other keys", async () => {
    const lru = new LruCache();
    await lru.set("menu:full:global", "1", 60);
    await lru.set("menu:categories", "2", 60);
    await lru.set("settings", "3", 60);
    await lru.delByPrefix("menu:");
    assert.equal(await lru.get("menu:full:global"), null);
    assert.equal(await lru.get("menu:categories"), null);
    assert.equal(await lru.get("settings"), "3");
  });

  it("cachedJson reads through once and then serves the cache", async () => {
    const recorder = new RecordingCache();
    setCacheBackend(recorder);
    let loads = 0;
    const load = async () => {
      loads += 1;
      return { value: 42 };
    };
    const first = await cachedJson("k", 60, load);
    const second = await cachedJson("k", 60, load);
    assert.deepEqual(first, { value: 42 });
    assert.deepEqual(second, { value: 42 });
    assert.equal(loads, 1, "second call is a cache hit");
  });

  it("cachedJson falls back to the loader when the cache is down", async () => {
    setCacheBackend({
      get: async () => {
        throw new Error("cache down");
      },
      set: async () => {
        throw new Error("cache down");
      },
      del: async () => {
        throw new Error("cache down");
      },
      delByPrefix: async () => {
        throw new Error("cache down");
      },
    });
    const value = await cachedJson("k", 60, async () => "fresh");
    assert.equal(value, "fresh", "a cache failure never breaks the request");
  });

  it("invalidation helpers clear exactly their own keys", async () => {
    const recorder = new RecordingCache();
    setCacheBackend(recorder);

    await invalidateCatalogueCache();
    await invalidateLocationsCache();
    await invalidateSettingsCache();
    await invalidateCmsCache();
    await invalidateJobsCache();

    assert.deepEqual(recorder.calls, [
      "delByPrefix menu:",
      "delByPrefix deals:",
      "delByPrefix locations:",
      "del settings",
      "delByPrefix cms:",
      "delByPrefix jobs:public:",
    ]);
    setCacheBackend(null);
    assert.ok(getCache() instanceof LruCache, "default backend is the in-process LRU");
  });

  it("fills a missing key once when many callers arrive together", async () => {
    setCacheBackend(new LruCache());
    let loads = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const load = async () => {
      loads += 1;
      await gate;
      return { n: loads };
    };
    const first = cachedJson("burst", 60, load);
    const second = cachedJson("burst", 60, load);
    release();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(loads, 1, "one database read fills the key for the burst");
    assert.deepEqual(a, b);
  });

  it("does not write a value that was loaded before invalidation", async () => {
    const lru = new LruCache();
    setCacheBackend(lru);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pending = cachedJson("menu:full:global", 60, async () => {
      await gate;
      return { stale: true };
    });
    await invalidateCatalogueCache();
    release();
    await pending;
    assert.equal(await lru.get("menu:full:global"), null, "stale fill must not repopulate the key");
  });

  it("keeps strict and fallback menu keys apart", () => {
    const id = "branch-1";
    const strict = catalogueCacheKey("menu:full", { locationId: id, required: true });
    const fallback = catalogueCacheKey("menu:full", { locationId: id, required: false });
    assert.notEqual(strict, fallback);
    assert.equal(catalogueCacheKey("deals", undefined), "deals:global");
    assert.equal(catalogueCacheKey("menu:full", undefined), "menu:full:global");
  });

  it("never caches the pricing path", async () => {
    const recorder = new RecordingCache();
    setCacheBackend(recorder);
    const { quoteCart } = await import("../src/services/quote.service.js");
    await assert.rejects(
      () => quoteCart("no-such-location", [{ kind: "product", id: "x", quantity: 1 }]),
      () => true,
    );
    assert.deepEqual(
      recorder.calls.filter((call) => call.startsWith("get") || call.startsWith("set")),
      [],
      "quotes must not read or write the cache",
    );
  });
});
