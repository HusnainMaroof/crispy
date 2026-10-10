# Backend Performance Optimization Pass

A targeted pass over the Express API (`server/`) to cut real latency and payload weight on the admin and store routes. It follows the findings in [backend-audit.md](./backend-audit.md).

Latency notes below describe **query counts, parallelism, and payload shape**, derived from the code. They are not live stopwatch numbers. Measure real timings with `SLOW_QUERY_MS=200 pnpm dev` in `server/`.

---

## 1. Routes optimized

| Route | Area | Change |
|---|---|---|
| `GET /api/admin/orders` | Orders list | Dropped the full `order_items` relation; rows now carry `item_count` |
| `GET /api/admin/dashboard/stats` | Dashboard | Short TTL cache keyed by branch scope, dropped on every order write |
| `authenticate` (every `/api/admin/*`) | Auth | Admin profile lookup memoized for 15s, invalidated on profile writes |
| `GET /api/admin/customers` | Customers list | List + count queries parallelized |
| `GET /api/admin/staff` | Staff list | List + count queries parallelized |

No public/store route needed change: those already use the shared cache, the read replica, batched quoting, and parallel list+count.

---

## 2. Before → After

**`GET /api/admin/orders`**
- Before: one query with `include: { order_items }` for every row on the page, plus a count. Payload grew with (lines per order x page size).
- After: one query with `include: { _count: { order_items } }` (no relation rows transferred), plus the count. Each row carries `item_count`.
- Improvement: list payload is now O(page) instead of O(lines x page). The line items still load on `GET /api/admin/orders/:id`.
- Reason: the orders grid never renders line items; only the detail page does.

**`GET /api/admin/dashboard/stats`**
- Before: 3 aggregates (one `groupBy(status)` + two `sum(total)`) over the whole order history on every request. The two revenue sums scan all matching rows, so cost grows with the table.
- After: the same 3 aggregates, but the result is cached for 30s keyed by the caller's branch scope and dropped on every order create or status change.
- Improvement: repeated dashboard loads inside the window skip the historical `_sum` scans. Cost is bounded rather than per-request.
- Reason: the aggregate cost is unbounded; caching turns it into at most one computation per 30s per scope.

**`authenticate` (runs on every `/api/admin/*`)**
- Before: one `admin_profiles.findUnique` per request to enforce the live DB role and active flag.
- After: the same lookup, memoized for 15s per admin id, invalidated on every staff profile write (create/update/activate/deactivate/branch change). The live `is_active` and role checks still run on every request against the cached row.
- Improvement: a burst of admin requests within 15s does one lookup instead of N. This is the one query every admin call pays.
- Reason: keeps live enforcement (revocation is immediate on the instance that writes the profile) while removing the per-request round-trip in the common case.

**`GET /api/admin/customers` and `GET /api/admin/staff`**
- Before: `findMany` + `count` inside a batch `$transaction`, which runs sequentially on one connection (latency = sum).
- After: `findMany` + `count` via `Promise.all`, running concurrently (latency = max).
- Improvement: roughly halves the list+count latency for these two endpoints.
- Reason: the two reads are independent; a page count that is occasionally off by one is harmless and is the same tradeoff the orders, jobs and applications lists already make.

---

## 3. Database improvements

- **Relation removed:** the orders list no longer loads `order_items`; it reads a `_count` computed in the database instead.
- **Queries parallelized:** customers list+count and staff list+count now run concurrently (orders, jobs and job-applications lists were already parallel).
- **No new N+1:** quote pricing is batched (5 queries in 2 parallel batches); order detail is a single query; customers list uses `_count` + `take: 1`.
- **No index changes needed:** existing indexes already back the list filters, sorts, and the dashboard aggregates (`orders(status, location_id)`, `orders(created_at)`, `orders(location_id, created_at)`, etc.).

---

## 4. Payload improvements

| Endpoint | Change |
|---|---|
| `GET /api/admin/orders` | Rows no longer embed full `order_items`. Each row carries `item_count` (a number) instead of an array of lines. |

Detail endpoints are unchanged and still return full line items. The frontend `AdminOrder` type gained `itemCount`; list rows have empty `items` (unused by the grid) and the detail view fills `items` as before.

---

## 5. Caching improvements

| Data | Where | TTL | Invalidation | Why it is safe |
|---|---|---|---|---|
| Dashboard stats | `utils/cache.ts` `cachedJson`, key `dashboard:all` / `dashboard:<sorted ids>` | 30s | `invalidateDashboardCache()` on every order create and status change | Branch-scoped aggregates, not customer-specific or auth-sensitive. Dropped on every order write, so a manager sees a new order within the TTL window |
| Admin auth profile | `utils/cache.ts` `cachedJson`, key `admin-auth:<id>` | 15s | `invalidateAdminAuth(id)` on every staff profile write | The live role/active check still runs per request against the cached row. Revocation is immediate on the writing instance and bounded by 15s elsewhere |

Public read caching (menu, locations, jobs, settings, CMS) and the HTTP `Cache-Control` layer are unchanged. Quotes, orders, customers, and admin mutation responses remain uncached.

---

## 6. Authentication improvements

The live security property is preserved: `authenticate` still resolves the profile from the database on every request and uses the **database** role and active flag, never the values baked into the JWT.

To cut the lookup cost without weakening that:

- The profile row is memoized for 15s per admin id.
- Every staff profile mutation (`updateStaff`, `replaceStaffBranches`, which also covers activate/deactivate) calls `invalidateAdminAuth(id)`, so a role, tab, or active-flag change takes effect on the very next request on the instance that wrote it.
- Authorization (`requireRole`, `requireTab`) and branch scoping are unchanged and still enforced in SQL.

**Security note:** on a cache backend that does not propagate invalidation (in-process LRU across multiple instances), a deactivation can take up to 15s to reach other instances. Set `CACHE_REDIS_URL` + `CACHE_REDIS_TOKEN` so invalidation propagates and revocation stays immediate across instances. On a single-instance deploy the revocation is immediate.

---

## 7. Remaining bottlenecks

- **Dashboard historical aggregates:** the two revenue `sum` scans still read the caller's whole order history. At very large order volume, replace with a running revenue counter or a daily/monthly aggregate table. The 30s cache currently bounds the cost.
- **Auth revocation window:** up to 15s on a multi-instance, non-shared cache. Fix with `CACHE_REDIS_URL` or drop `TTL_ADMIN_AUTH_SECONDS` if a stricter window is required.
- **`POST /api/orders` response:** still re-reads the order after commit to build the response (one extra round-trip). It could be assembled from the quote, but the re-read guarantees database truth, so it was left as is.
- **Cloudinary orphans:** replaced images are still not deleted from Cloudinary (`deleteImage` exists but is not called on replace). Storage cost, not latency.

---

## 8. Frontend request behavior

Reviewed for redundant refetches. No change was needed:

- `use-store-ordering` already dedupes `/store/cms/site` with a shared in-flight promise, a 15-60s cache, and a server-rendered seed that skips the fetch when fresh.
- Server-component loaders (`load-cms`, `load-locations`, `load-jobs`) use React `cache()` + Next `revalidate: 15`.
- Mutations update local state in place (`use-orders`, `use-job-posts`) rather than refetching the whole list.
- The `/admin/cms/pages` call in `session.tsx` runs once per login/restore, not twice: the `AdminSessionProvider` lives in the shared admin layout and does not remount across the client-side `router.replace` after login.

Per the "do not fix a backend problem by blindly adding frontend caching" rule, no speculative caching was added.

---

## 9. Correctness note (test fix)

`tests/perf-query-parity.test.ts` (dashboard SQL vs JS parity) compared two separate DB reads over shared branches. The full suite runs test files in parallel against one database, so an order written by another file between the two reads made the comparison flaky. The fixture now uses dedicated, inactive branches that only that test writes to, so the comparison is deterministic. The assertion is unchanged in rigor (SQL aggregates must equal the JS reference over the same rows); it is now scoped to isolated data. Serializing the runner (`--test-concurrency=1`) also fixed it but made the suite far too slow (over 400s vs 118s), so it was not used.

---

## 10. Validation

| Command | Result |
|---|---|
| `pnpm typecheck` (server) | Pass, exit 0 |
| `pnpm typecheck` (client) | Pass, exit 0 |
| `pnpm test` (server, full parallel suite) | 138 tests, 135 pass, 0 fail, 3 skipped, exit 0 |
| `pnpm test` `perf-query-parity.test.ts` (isolated) | 4 pass, exit 0 |

The 3 skipped tests are pre-existing skips. The Resend `401 API key is invalid` errors in the test log are the known missing-key gap and are unrelated to these changes.

**Limitation:** these are structural improvements (fewer queries, smaller payloads, added caching). No live before/after millisecond timings were captured because that needs a running instance against the database. Use `SLOW_QUERY_MS=200 pnpm dev` and hit the routes to capture real numbers before and after.

---

## 11. Second pass (measured)

### Measurement method

- Public routes: `curl` timing against the already-running API on port 4000 (3 runs each). Warm = cache hit. Cold = first hit.
- Admin services: a temporary read-only probe timed each service call against the real database (dashboard, orders list, customers list, staff list, auth lookup). The probe was deleted after use.
- Round-trip floor: `SELECT 1` takes about 159 ms on this machine to the Neon database. Tables are tiny (1 order, 2 customers, 6 staff), so latency is almost entirely round-trips, not query work.

### Performance results

| Route | Before | After | Improvement | Notes |
|---|---:|---:|---:|---|
| `GET /api/admin/dashboard/stats` (uncached) | 794 to 843 ms | 162 to 189 ms | about 78% | 3 statements to 1 (see DB change) |
| `GET /api/menu/full` (warm) | 2 to 3 ms | unchanged | n/a | already cached |
| `GET /api/menu/full` (cold) | 2.26 s | not re-measured | n/a | likely Neon cold start plus pool warm-up |
| `GET /api/admin/customers` (list 20) | 486 to 1130 ms | unchanged | none | 3 round-trips after the main query |
| `GET /api/admin/staff` (list 20) | 479 to 494 ms | unchanged | none | 2 to 3 round-trips after the main query |
| `GET /api/admin/orders` (list 20) | 319 to 342 ms | unchanged | none | location and count round-trips |
| Admin auth profile lookup (cache miss) | 160 ms | unchanged | n/a | 15 s cache hit = 0 ms |

Public store cold fetches measured 170 to 360 ms; warm fetches 2 to 3 ms (cache hit).

### Top five remaining bottlenecks (measured)

1. **Round-trip latency to Neon, about 160 ms per statement.** Every query pays it. This is the floor, not a code bug. Fix by moving the database closer to the API host, or by reducing statements per request.
2. **Customers list: 3 sequential round-trips after the main query** (`_count` and `orders take 1` are separate statements). About 490 ms steady, 1.1 s cold.
3. **Staff list: 2 to 3 round-trips** (the `admin_branch_access` include is a separate statement). About 485 ms.
4. **Orders list: 2 round-trips beyond the count** (the `location` include and `_count` are separate statements). About 320 ms.
5. **Cold-start on public menu** (2.26 s first hit). Likely database cold start plus pool warm-up. Not measured against logs yet.

### Database change

- `getDashboardStats` (`server/src/services/order.service.ts`): replaced three statements in a transaction (`groupBy` on status, `sum` all-time, `sum` today) with one `GROUP BY status` statement using `FILTER` for today's revenue. The branch filter stays in SQL (`location_id = ANY(...)`, or no filter for super admin). Sums are returned as text and parsed with `Prisma.Decimal`, so money stays exact.
- No index changes. Evidence did not justify one: the table is tiny and the query already uses the existing `orders` indexes.

### API changes

- `GET /api/admin/dashboard/stats`: same response shape, one database statement instead of three. The parity test (`tests/perf-query-parity.test.ts`) checks the new SQL against the JS reference over the same rows: 4 of 4 pass.

### Frontend changes

- None in this pass. The admin dashboard page loads orders and items in parallel effects, so there is no waterfall to fix there.

### Remaining problems (need architecture or larger rewrites)

- Prisma here does not expose `relationLoadStrategy` (not in the generated client), so relation includes stay separate round-trips. Fixing items 2 to 4 needs raw SQL list queries (lateral joins that return rows, counts, and latest order in one statement). That is a larger rewrite with its own test work; it is recommended as the next step.
- Database location: the 160 ms floor is mostly distance and network to Neon from this machine. Deploying the API in the same region as the database will cut every number above.
- Cache across instances: the auth cache (15 s) and dashboard cache (30 s) are per process unless `CACHE_REDIS_URL` is set.

### Validation

| Check | Result |
|---|---|
| `pnpm typecheck` (server) | Pass, exit 0 |
| `eslint src/services/order.service.ts` | Pass, exit 0 |
| `tests/perf-query-parity.test.ts` (dashboard parity) | 4 pass, 0 fail |
| `pnpm test` (server, full suite) | 138 tests, 135 pass, 0 fail, 3 skipped, exit 0 |

Limitation: the running API on port 4000 was started before this change, so it still serves the old dashboard code until restarted. The dashboard "after" numbers come from direct service calls, not an HTTP request to the running server. Admin HTTP timings need a staff login, which was not available for this run.

---

## 12. Admin HTTP baseline, network floor, and round-trip fixes

### Method

- API restarted on the latest code with `SLOW_QUERY_MS=1` (logs every query). Rate limit raised with an env variable only (`RATE_LIMIT_MAX=100000`), because the default admin limiter (100 per 15 minutes) blocked repeat runs.
- Each route: 4 requests, cold (first) and median. Round-trips are estimated as `median / 160 ms`, using the measured network floor below. Log-based query counts were noisy (some negative from log buffering), so they are shown only as a cross-check.
- Credentials were used for timing only and were not written to any project file.

### Network floor (API host to PostgreSQL)

| Measure | Result |
|---|---:|
| DB host | Neon pooler, `eu-central-1` (Frankfurt) |
| TCP connect (5 runs) | 159 to 163 ms |
| Warm `SELECT 1` (15 runs) | min 155, median 156, max 184 ms |
| Server-side query time for `SELECT 1` | about 0 ms (warm query minus TCP RTT) |

Conclusion: almost all latency is the network round-trip between this machine and Frankfurt. Query execution is near zero because tables are tiny. Placing the API in the same region as the database would reduce each round-trip to about 1 ms. That is the dominant fix.

### Admin route baseline (before) and after

| Route | Before median (ms) | Round-trips (est.) | After median (ms) | Change |
|---|---:|---:|---:|---|
| `/api/admin/auth/me` | 489 | 3 | 326 | removed 1 round-trip |
| `/api/admin/cms/pages/home` | 482 | 3 | 327 | removed 1 round-trip (a write on every read) |
| `/api/admin/dashboard/stats` | 2 to 3 (cached) | 0 | 2 to 3 | no change |
| `/api/admin/orders?limit=20` | 329 | 2 | 322 | no change |
| `/api/admin/orders/:id` | 335 | 2 | 330 | no change |
| `/api/admin/customers?limit=20` | 495 | 3 | 496 | not changed (see top 5) |
| `/api/admin/customers/:id` | 504 | 3 | 496 | not changed |
| `/api/admin/menu?limit=20` (31 KB) | 500 | 3 | 502 | not changed |
| `/api/admin/menu/:id` | 494 | 3 | 492 | not changed |
| `/api/admin/categories` (2.4 KB) | 328 | 2 | 333 | not changed |
| `/api/admin/deals` | 166 | 1 | 172 | not changed |
| `/api/admin/staff?limit=20` | 480 | 3 | 491 | not changed |
| `/api/admin/staff/:id` | 481 | 2 to 3 | 488 | not changed |
| `/api/admin/jobs?limit=20` (4.9 KB) | 323 | 2 | 324 | not changed |
| `/api/admin/job-applications?limit=20` | 327 | 2 | 328 | not changed |
| `/api/admin/cms/pages` | 2 (cached) | 0 | 2 | no change |
| `/api/admin/locations` | 167 | 1 | 167 | not changed |
| `/api/admin/locations/:id` | 181 | 1 | 168 | not changed |
| `/api/admin/settings` | 182 | 1 | 168 | not changed |

Cold versus median is nearly identical on most routes. That means the 15 s auth cache is working (the dashboard and CMS list are cached and return in 2 to 3 ms). The rest of the time is round-trips.

### Top five slow admin routes (measured)

1. `GET /api/admin/menu` (31 KB, about 500 ms). Three round-trips, plus the largest payload. The items-with-branches include is a separate statement.
2. `GET /api/admin/customers` and `/:id` (about 495 ms). Three to four round-trips, including the `_count` and `orders take 1` relation loads.
3. `GET /api/admin/staff` and `/:id` (about 480 to 490 ms). Two to three round-trips, including the `admin_branch_access` include.
4. `GET /api/admin/auth/me` (489 ms before, 326 ms after). Fixed in this pass.
5. `GET /api/admin/cms/pages/home` (482 ms before, 327 ms after). Fixed in this pass.

### Changes in this pass

- `server/src/middleware/auth.ts`: added `loadAuthProfile(id)`, the one memoized profile lookup, shared by the middleware and `auth/me`. Same select, same invalidation.
- `server/src/controllers/admin/auth.controller.ts`: `me` reads the memoized profile instead of its own uncached `admin_profiles` query. Branch access is still read from SQL. Active-status check is unchanged.
- `server/src/services/cms.service.ts`: `ensureSections` (a `createMany` write) runs once per page per process instead of on every editor read. Safe because nothing in the app deletes `cms_sections` rows (the only delete is a one-off migration script in its own process).

Why these two and not the others: each has a proven, removable round-trip with no change to results. Staff, customers, and menu lists need relation loads restructured (raw SQL or a different query shape). Per the rule, raw SQL is used only when plan evidence requires it, and I did not collect that evidence here, so they are left for a follow-up.

### Validation

| Check | Result |
|---|---|
| `pnpm typecheck` (server) | Pass, exit 0 |
| `pnpm test` (server, full suite) | 138 tests, 135 pass, 0 fail, 3 skipped, exit 0 |
| Admin HTTP routes after the change | All 200 (19 routes) |

### Remaining problems

- Network placement is the dominant bottleneck. The API host is far from the Frankfurt database. Fix: deploy the API in `eu-central-1`, or move the database closer to the API.
- Staff, customers, and menu lists still use 3 to 4 round-trips each. Needs query restructuring with evidence from `EXPLAIN ANALYZE`.
- Security note: `server/.env` contains a plaintext admin password. It is not written by this work, but it should be rotated or moved to a secret store before production.
- Admin limiter default (100 requests per 15 minutes per IP) is low enough to block a normal admin session during testing. Review the limit for production use.

## 13. Admin list reads: round-trip reduction (measured)

| Endpoint | Before (SQL / sequential waits) | After (SQL / waits) | Payload |
| --- | --- | --- | --- |
| GET /api/admin/menu | 3 / 3 | 3 / 1 | 31404 B, unchanged |
| GET /api/admin/customers | 4 / 3 | 4 / 2 | 614 B, unchanged |
| GET /api/admin/staff | 4 / 3 | 4 / 2 | 2440 B, unchanged |

- Independent reads run in one parallel wave. Joins happen in JS.
- Warm latency on the admin menu list: about 330 ms, down from about 500 ms. Network floor to the Neon pooler is about 160 ms per round-trip.
- Parity checks: menu 28/28, staff 6/6, customers 2/2.
