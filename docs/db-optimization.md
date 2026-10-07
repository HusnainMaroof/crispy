# Crispies — Database optimization

How the database layer was optimized for performance and scalability without
changing any business logic, API contract, or behavior.

Scope: `server/` (Express 4 + Prisma 7 with `@prisma/adapter-pg` on Neon Postgres).
Related docs: [architecture.md](./architecture.md), [backend.md](./backend.md).

Every phase below lists: findings, changes, risk notes (which hard constraint is
satisfied and how), and rollback.

Hard constraints honored throughout:

1. No change to response shapes, envelopes, error codes, status workflow, auth/role rules, or cookie behavior.
2. The server still prices every order line. Checkout re-quotes at submit time; no quote is ever cached.
3. Order lines remain snapshots. `orders.location_id`, `order_items.menu_item_id`, `order_items.deal_id` stay nullable with `ON DELETE SET NULL`.
4. Status updates stay `updateMany` on (id + current status), so a lost race returns 409.
5. Auth keeps using the database role and active flag; nothing auth-related is cached.
6. Guest and branch-scoped visibility rules are identical.
7. `hours: "Coming Soon"` remains the single coming-soon marker.
8. Schema changes only via a new migration folder. No `prisma db push`, no `migrate reset`, no edits to `generated/`.
9. Money stays Prisma `Decimal`, rounded once. Emails run after commit and never roll back writes.

---

## Phase 0 — Measure

### Findings (ranked by impact)

The service layer had already been through a batching pass (per-line quote
lookups, N+1 relation loads, and JS-side aggregates were replaced earlier), so
Phase 0 mostly confirmed those and found the remaining gaps:

| # | Finding | Where | Impact | Status |
|---|---|---|---|---|
| 1 | No cache on hot anonymous reads (`GET /api/menu/full`, `/menu/deals`, `/store/locations`, `/store/settings`, `/store/cms/:page`, `/store/jobs`), so every page view hits Postgres | services | High (read QPS is the whole traffic) | Phase 5 |
| 2 | No index for `branch_deals (location_id, available)`, `job_posts (location_id, status)`, `job_applications (job_post_id, status)`; `menu_items (category_id, active)` could not serve the `ORDER BY sort_order` | schema | High on growing tables | Phase 2 |
| 3 | No pool tuning (`max`, idle/connect timeouts) and no slow-query visibility | `config/prisma.ts` | High (connection storms, blind regressions) | Phase 3 |
| 4 | All reads use the primary; no read-replica routing | everywhere | Medium (read scaling headroom) | Phase 4 |
| 5 | No graceful `Prisma.$disconnect` on shutdown | `index.ts` | Low | Phase 3 |
| 6 | Customer/order/staff CRM search uses `contains, mode: "insensitive"` (ILIKE `%q%`), which no btree index can serve | `customer.service.ts`, `order.service.ts`, `staff.service.ts` | Low at current scale | Left as-is (see note) |

Already good (verified, no change needed):

- `quoteCart` prices a cart in 4 + 2 batched queries instead of 2 per line (a 40-line cart was 81 sequential round-trips).
- `getFullMenu`, `getDeals`, `getCategories` use relation includes with `select` projections and `take` caps; no N+1.
- Admin orders use one `findMany` with nested `order_items`; customers use `_count` + `take: 1` for the latest order; `countStaffByLocation` is one `groupBy`.
- Dashboard stats are SQL aggregates (`groupBy` + `aggregate`), in one transaction.
- Lists are paginated (`utils/pagination.ts`, default 20, cap 100) with additive `pagination` metadata.
- Checkout reads and validates before the transaction; only customer upsert + order + `createMany` order items run inside it.
- `identifyCustomer` never touches the database (cookie only).
- Orders list search and staff visibility filters run in SQL, not in JavaScript.

CRM search note: `pg_trgm` GIN indexes would serve the `ILIKE '%q%'` searches.
Tables are small today (nine branches, one brand) and the searches are paginated
admin screens, so the extension is deferred until `pg_stat_statements` shows
these queries matter.

### EXPLAIN checklist (run on Neon)

```sql
-- Replace the values with real ids from your data.
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM menu_categories c
JOIN menu_items i ON i.category_id = c.id
WHERE i.active = true AND i.sort_order >= 0
ORDER BY c.sort_order, i.sort_order;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM branch_menu_items
WHERE location_id = '<uuid>' AND available = true;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE location_id = '<uuid>'
ORDER BY created_at DESC, id DESC
LIMIT 20;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = '<uuid>'
ORDER BY created_at DESC, id DESC
LIMIT 20;

EXPLAIN (ANALYZE, BUFFERS)
SELECT status, COUNT(*) FROM orders GROUP BY status;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM job_posts
WHERE location_id IN ('<uuid>') AND status = 'active'
ORDER BY created_at DESC, id DESC;
```

What to look for: `Seq Scan` on orders/branch tables, `Sort Method: external`,
`shared buffers` reads that stay high after warmup, and row estimates far from
actuals (needs `ANALYZE`).

### `pg_stat_statements` (enable the extension on Neon first)

```sql
-- Top queries by total time
SELECT calls, mean_exec_time, total_exec_time,
       rows, left(query, 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Slow on average
SELECT calls, mean_exec_time, left(query, 120) AS query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Cache hit ratio (should stay near 99%)
SELECT sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS hit_ratio
FROM pg_statio_user_tables;

-- Index usage: tables where indexes are never used
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 20;
```

Also: `SLOW_QUERY_MS=200` on the app logs every SQL statement slower than 200ms
through Pino (`slow query` events with duration and SQL text).

---

## Phase 1 — Query optimization

### Findings

No code change was required. Every item on the list was already implemented and
is covered by tests (`tests/quote.test.ts`, `tests/perf-query-parity.test.ts`):

- quote/checkout batch catalogue rows and branch rows with `where id IN (...)`,
  keep request-order resolution, and still report the offending line in
  `ERR_ITEM_UNAVAILABLE` (parity proven in `perf-query-parity.test.ts` against a
  per-line reference implementation);
- menu, deals, admin orders, admin customers, admin locations staff counts, and
  job/application scoping are single queries or grouped aggregates;
- list endpoints project only the fields they serialize (`select`),
- dashboard stats are SQL aggregates with exactly the old semantics
  (`total_orders`, `active_orders`, `revenue` including cancelled,
  `today_revenue` since 00:00 UTC), proven against a JS reference in tests;
- admin lists are paginated with safe clamped defaults (additive `pagination` key);
- checkout keeps reads/validation before the transaction and the order +
  order_items write atomic;
- `identifyCustomer` does not touch the database.

### Rollback

Not applicable (no change).

---

## Phase 2 — Indexes

### Changes

New migration `server/prisma/migrations/20261006130000_perf_indexes/`:

| Index | Query it serves |
|---|---|
| `branch_deals (location_id, available)` | `getDeals` branch lookup |
| `job_posts (location_id, status)` | branch-scoped job lists with `?status=` |
| `job_applications (job_post_id, status)` | applications grid filtered by post and status |
| `menu_items (category_id, active, sort_order)` | `getFullMenu` item list, replaces `(category_id, active)` so the sort is index order |

`schema.prisma` mirrors all four with `@@index`, so Prisma and the database stay
in sync.

**CONCURRENTLY caveat:** Prisma runs each migration inside a transaction, so
`CREATE INDEX CONCURRENTLY` cannot be used in a migration file. These tables are
small (nine branches, one brand), so a plain `CREATE INDEX` takes a brief lock
and is safe. If a table is large when you apply this, create the same index
manually with `CREATE INDEX CONCURRENTLY` and mark the migration applied.

### Risk notes

- Constraint 8: schema changes only through the new migration folder; applied with `pnpm migrate`.
- Indexes do not change any query result, only access paths.
- The replaced `menu_items (category_id, active)` index is dropped in the same migration; the new composite covers its prefix.

### Rollback

```sql
DROP INDEX IF EXISTS "branch_deals_location_id_available_idx";
DROP INDEX IF EXISTS "job_posts_location_id_status_idx";
DROP INDEX IF EXISTS "job_applications_job_post_id_status_idx";
DROP INDEX IF EXISTS "menu_items_category_id_active_sort_order_idx";
CREATE INDEX "menu_items_category_id_active_idx" ON "menu_items"("category_id", "active");
```

Also revert the four `@@index` lines in `schema.prisma`.

---

## Phase 3 — Connections

### Changes

`server/src/config/prisma.ts`:

- One shared `PrismaClient` per endpoint (primary, and replica when configured), created once per process.
- `pg.Pool` tuning through env: `DB_POOL_MAX` (default 10), `DB_IDLE_TIMEOUT_MS` (30000), `DB_CONNECT_TIMEOUT_MS` (10000). Total connections = instances x `DB_POOL_MAX`.
- Slow-query logging through Pino, `SLOW_QUERY_MS` env, default 0 (off). Timed around every SQL statement at the pg pool, so it logs the real SQL text and duration.
- `disconnectPrisma()` closes both pools from the graceful shutdown in `index.ts`.

The app keeps using the pooled `NEON_DATABASE_URL`; migrations keep using
`NEON_DIRECT_URL` (falls back to the pooled URL).

### Risk notes

- No behavior change; connection handling only.
- Slow-query logging is off by default, so production logs stay quiet.

### Rollback

Revert `src/config/prisma.ts` and the shutdown hook in `src/index.ts`; remove the
new env vars from `.env`.

---

## Phase 4 — Read replicas

### Changes

- Optional `NEON_READ_REPLICA_URL`. **Unset = everything on the primary, exactly as today.**
- `getReadPrisma()` returns the replica client when configured, else the primary.
- Services take an explicit `read` flag on the public read functions. Only these
  routes pass it (call sites commented with the replication-lag assumption):

| Replica-routed | Why lag-tolerant |
|---|---|
| `GET /api/menu/full`, `/menu/categories`, `/menu/items`, `/menu/deals` | A menu render can be seconds behind; the order path re-prices on the primary |
| `GET /api/store/locations`, `/store/locations/:id` | Branch list changes rarely |
| `GET /api/store/settings` | Display values only |
| `GET /api/store/cms/:page` | Marketing copy |
| `GET /api/store/jobs` | Careers list |

Always primary: anything in a transaction, `POST /api/menu/quote`, `POST /api/orders`,
`GET /api/orders/*`, `/api/customers/me`, `PATCH /api/store/location`,
`GET /api/store/location`, all `/api/admin/*`, auth, status updates, and every write.

### Risk notes

- Constraints 2 and 6 untouched: pricing, orders, and visibility never use the replica.
- Read-your-writes is preserved: after checkout the customer reads their order from the primary.
- Default behavior is byte-identical when the env var is unset.

### Rollback

Unset `NEON_READ_REPLICA_URL`. No code revert needed.

---

## Phase 5 — Caching

### Changes

`server/src/utils/cache.ts`:

- `CacheBackend` interface: `get` / `set` / `del` / `delByPrefix` with TTL.
- In-process LRU by default (500 keys, per-entry TTL).
- Optional shared backend: `CACHE_REDIS_URL` + `CACHE_REDIS_TOKEN` (Upstash-style
  REST). With several instances and only the in-process cache, each instance has
  its own copy; TTLs are short so the staleness window is bounded by the TTL.
- `setCacheBackend()` is the test seam.

Cached (anonymous, non-personalized, read-only only):

| Data | Key | TTL |
|---|---|---|
| Menu (full, categories, items) | `menu:full:{branch}:{strict\|fallback}`, `menu:categories`, `menu:items:...:plain` | 60s |
| Deals | `deals:{branch}:{strict\|fallback}` or `deals:global` | 60s |
| Public locations list | `locations:active` / `locations:all` | 60s |
| Store settings | `settings` | 120s |
| Public CMS pages | `cms:{page}:{locale}` | 120s |
| Public jobs list | `jobs:public:{branch or all}:{limit}` (capped at 500) | 60s |

Never cached: quotes, orders, customers, anything keyed to `crispy_customer_id`,
auth/session data, admin responses, the checkout path. This is structural:
caching only happens when a controller passes `cache: true`, and only the public
anonymous read handlers do.

Invalidation lives in the service layer next to every write:

| Write | Clears |
|---|---|
| Category / menu item / deal create, update, delete; branch menu & deal upserts | `menu:*`, `deals:*` |
| Location create, update, deactivate | `locations:*`, `menu:*`, `deals:*` |
| Settings PUT | `settings` |
| CMS section patch / move / reset | `cms:*` |
| Job post create / update / status / delete | `jobs:public:*` |

HTTP cache headers (public GETs only):

- Cookie-free (`/api/menu/categories`, `/api/menu/items`, `/api/store/locations*`,
  `/api/store/settings`, `/api/store/jobs`): `Cache-Control: public, max-age=60, stale-while-revalidate=120`.
- Cookie-bound (`/api/menu/full`, `/api/menu/deals`, `/api/store/cms/:page`,
  `/api/store/homepage`): `Vary: Cookie` plus `public, max-age=30,
  stale-while-revalidate=60`, so a shared cache never serves one visitor's
  branch or language to another. The menu and deals cache keys also split
  `strict` (unknown branch is 404) from `fallback` (stale cookie uses the
  global catalogue), so those two responses cannot collide.
- If the response already has `Set-Cookie` (a new `crispy_customer_id`), the
  header is `private, no-store` instead. A shared cache must not store that
  cookie and hand the same guest id to the next visitor.
- Cache fills are single-flight per key. A load that started before an
  invalidation does not write the old value back.
- A cache fill always reads the primary. `read: true` still selects the replica
  only when the response is not being stored. A miss logs `cache fill` at info.
  A hit logs `cache` at debug.
- Express's default weak ETag still applies. Quotes, orders, customers, and all
  admin responses get no cache headers.

### Risk notes

- Constraint 2: the checkout path never reads the cache (proven by test).
- Price staleness is bounded at 60s and only affects display prices; the server
  re-prices every line at quote and checkout, and the cart labels display prices
  as such (existing behavior).
- Constraint 7: untouched; coming soon is derived from `hours`, which travels
  with cached location rows.

### Rollback

Set `CACHE_DISABLED`... not implemented; instead: revert `src/utils/cache.ts`
usage (or set `setCacheBackend(new LruCache(0))` equivalent). Simplest rollback:
revert the service and controller commits from this phase and remove
`CACHE_REDIS_URL` / `CACHE_REDIS_TOKEN` from the environment.

---

## Phase 6 — Sharding readiness

**Decision: do not shard.** Neon/Postgres has no native sharding, and this
workload is one brand with nine branches. From Phase 0: every hot query is
already indexed and batched, tables are small, and the whole read load can be
moved off the primary with Phase 4 before any split is considered.

- Natural shard key: `location_id` on `orders`, `order_items` (via orders),
  `branch_menu_items`, `branch_deals`, `admin_branch_access`, `job_posts`.
- Cross-shard queries if it ever happened: dashboard stats (company-wide
  aggregates), the global catalogue (`menu_items`, `deals`, `menu_categories`),
  the customers CRM, and CMS. These would need a merge layer or a replicated
  "global" dimension store.
- Routing seam: every service reaches the database through `getPrisma()` /
  `getReadPrisma()` in `src/config/prisma.ts` (plus `$transaction` helpers). A
  future per-location split only has to change that seam and the handful of
  cross-shard queries above, not the services.

Cheaper alternatives to evaluate first, in order:

1. Keep reads off the primary (Phase 4) and cache anonymous reads (Phase 5).
2. Neon autoscaling / compute sizing; `pg_stat_statements` before anything structural.
3. Partition `orders` / `order_items` by `created_at` (monthly) once the table
   passes roughly 10M rows; archive delivered/cancelled orders older than ~24
   months to a separate table or dump.

### Decision thresholds

| Signal | Threshold | Action |
|---|---|---|
| `orders` rows | > 10M, or > 1M added per quarter | consider `created_at` partitioning + archiving |
| Read QPS on primary | sustained > 500 qps after replicas + cache | add replica capacity first, shard last |
| p95 latency (quote/checkout) | > 300ms with warm cache | investigate `pg_stat_statements` before structural change |
| Write QPS on `orders` | sustained > 200 inserts/s | partitioning, then per-location split |

---

## Verification

Run against a **development** database only (`NEON_DATABASE_URL` pointed at it;
never the live database):

```
pnpm typecheck
pnpm lint
pnpm test
```

New tests:

| File | Covers |
|---|---|
| `tests/perf-cache.test.ts` | LRU eviction and TTL, `delByPrefix`, cache failure fallback, invalidation helpers clear exactly their keys, quotes never touch the cache |
| `tests/perf-query-parity.test.ts` | Batched quote equals the old per-line implementation (including `ERR_ITEM_UNAVAILABLE` with the offending line), SQL dashboard aggregates equal the old JS semantics |
| `tests/perf-read-routing.test.ts` | Default routing is the primary; public reads go to the replica; pricing paths stay on the primary (needs `TEST_READ_REPLICA_URL` pointing at a second, empty database) |

### Before/after query counts per hot endpoint

| Endpoint | Before this work | After |
|---|---|---|
| `GET /api/menu/full` | 3 queries per request | 0 (cache hit), 3 on miss or expiry |
| `GET /api/menu/deals` | 2 | 0 on hit, 2 on miss |
| `GET /api/store/locations` | 1 | 0 on hit, 1 on miss |
| `GET /api/store/settings` | 1 | 0 on hit, 1 on miss |
| `GET /api/store/cms/:page` | 1 | 0 on hit, 1 on miss |
| `GET /api/store/jobs` | 1 | 0 on hit, 1 on miss |
| `POST /api/menu/quote` | 5 (batched; was 2 per line before the earlier pass) | unchanged, never cached |
| `POST /api/orders` | 2 pre-transaction reads + 3-in-transaction writes + 1 read-back | unchanged |

EXPLAIN comparisons: run the Phase 0 checklist before and after `pnpm migrate`;
the index-backed plans should show `Index Scan` / `Index Only Scan` on the new
indexes instead of `Seq Scan` + `Sort`.
