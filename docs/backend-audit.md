# Backend Audit — Super Admin and Store

> **Update:** a performance pass followed this audit. See [backend-optimizations.md](./backend-optimizations.md) for what was changed (trimmed the admin order list, cached dashboard stats and the auth lookup, parallelized the customers/staff lists), with before/after notes.

Audit of the Express API (`server/`) that backs both the super admin dashboard and the public storefront. It covers the image/CDN storage path, every route, how data flows, how long each route is likely to take and why, whether any route is duplicated or called more than once, and where caching sits.

Latency is described as **round-trips and payload shape**, measured from the code structure (number of DB queries, joins, cache hit/miss, row growth). It is not a live stopwatch measurement against production. Run `SLOW_QUERY_MS=200 pnpm dev` in `server/` to see real slow SQL.

---

## 1. Image upload → Cloudinary link is stored

Confirmed. The flow is correct end to end:

```
Browser (client/app/super-admin/...)
  → POST /api/admin/upload          (image)  or  /api/admin/upload-media (video)
    → upload.service.ts
      → cloudinary.uploader.upload_stream
        → returns result.secure_url + result.public_id
  ← { url, publicId }
  → the URL string is saved into the form field
  → the form is saved to Postgres
```

| Piece | Where | What is stored |
|---|---|---|
| Upload service | `server/src/services/upload.service.ts` | Returns `secure_url` (the `https://res.cloudinary.com/...` link), not a local path |
| Upload controller | `server/src/controllers/admin/upload.controller.ts` | Sends `{ url, publicId }` to the client |
| Client menu images | `client/app/super-admin/menu/page.tsx` | `setImage(url)` then saved as `menu_items.image` |
| Client CMS media | `client/app/super-admin/cms/cms-fields.tsx` | `onChange(result.url)` then saved in `cms_section_translations.content` JSON |
| CV uploads | `server/src/controllers/store/actions.controller.ts` | `uploadDocument` → `secure_url`, stored on the job application |

**Only the Cloudinary link is stored.** The raw file never lands on disk (multer keeps it in memory, then streams it to Cloudinary). Images are transformed on the way in: max 2000×2000, quality 82, `f_auto` (WebP/AVIF delivery).

Two things worth noting:

- The `publicId` is returned but the client only keeps `url`. The old-image delete hook (`deleteImage`) exists but is not called on replace, so replaced/orphaned images stay in Cloudinary. Not a correctness bug, but a storage-cost loose end.
- The media field accepts a hand-typed `https://` URL or a local `/images/...` path too (`validators/cms.schema.ts`). So not every stored image is guaranteed to be a Cloudinary link; a manual entry can be any https URL.

---

## 2. Route inventory (no duplicates)

Every route is registered exactly once. There is **no method+path collision**. Two paths intentionally share one handler (aliases), called out below.

### Public

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/menu/full` | `MenuController.full` | Branch-aware catalogue |
| GET | `/api/menu/categories` | `MenuController.categories` | Global categories |
| GET | `/api/menu/items` | `MenuController.items` | Global items |
| GET | `/api/menu/deals` | `MenuController.deals` | Branch-aware deals |
| POST | `/api/menu/quote` | `MenuController.quote` | Server pricing |
| GET | `/api/store/locations` | `StoreController.locations` | Active branches |
| GET | `/api/store/locations/:id` | `StoreController.locationById` | |
| GET | `/api/store/location` | `StoreController.myLocation` | Cookie branch |
| PATCH | `/api/store/location` | `StoreController.setLocation` | Sets cookie |
| GET | `/api/store/settings` | `StoreController.settings` | |
| GET | `/api/store/homepage` | `StoreController.content` | **Alias** of `/api/store/cms/home` |
| GET | `/api/store/cms/:page` | `StoreController.content` | One CMS page |
| GET | `/api/store/jobs` | `StoreJobsController.list` | |
| GET | `/api/store/jobs/:id` | `StoreJobsController.getById` | |
| POST | `/api/orders` | `ActionsController.createOrder` | Checkout |
| GET | `/api/orders/mine` | `ActionsController.myOrders` | |
| POST | `/api/orders/lookup` | `ActionsController.lookupOrder` | |
| GET | `/api/orders/:id` | `ActionsController.getOrder` | Own orders only |
| GET | `/api/customers/me` | `CustomerController.me` | |
| PATCH | `/api/customers/me` | `CustomerController.updateMe` | |
| POST | `/api/contact` | `ActionsController.contact` | |
| POST | `/api/jobs/cv` | `ActionsController.uploadCv` | CV upload |
| POST | `/api/jobs/:id/apply` | `ActionsController.applyForJob` | |
| POST | `/api/franchise/brochure` | `FranchiseController.requestBrochure` | |

### Admin (all behind `authenticate` + `requireTab`)

| Method | Path | Handler |
|---|---|---|
| POST | `/api/admin/auth/login` | `AuthController.login` |
| POST | `/api/admin/auth/logout` | `AuthController.logout` |
| POST | `/api/admin/auth/refresh` | `AuthController.refresh` |
| GET | `/api/admin/auth/me` | `AuthController.me` |
| PATCH | `/api/admin/auth/me` | `AuthController.updateMe` |
| GET, POST | `/api/admin/categories` | `CategoriesController.list / create` |
| GET, PUT, DELETE | `/api/admin/categories/:id` | `CategoriesController.getById / update / remove` |
| GET, POST | `/api/admin/menu` | `MenuItemsController.list / create` |
| GET, PUT, DELETE | `/api/admin/menu/:id` | `MenuItemsController.getById / update / remove` |
| GET, POST | `/api/admin/deals` | `DealsController.list / create` |
| GET, PUT, DELETE | `/api/admin/deals/:id` | `DealsController.getById / update / remove` |
| PATCH | `/api/admin/deals/:id/toggle` | `DealsController.toggle` |
| GET | `/api/admin/orders` | `OrdersController.list` |
| GET | `/api/admin/orders/:id` | `OrdersController.getById` |
| PATCH | `/api/admin/orders/:id/status` | `OrdersController.updateStatus` |
| GET | `/api/admin/customers` | `AdminCustomersController.list` |
| GET | `/api/admin/customers/:id` | `AdminCustomersController.getById` |
| GET, POST | `/api/admin/staff` | `StaffController.list / create` |
| GET, PATCH | `/api/admin/staff/:id` | `StaffController.getById / update` |
| POST | `/api/admin/staff/:id/activate` / `deactivate` | `StaffController` |
| PUT | `/api/admin/staff/:id/branches` | `StaffController.branches` |
| GET | `/api/admin/cms/pages` | `CmsController.pages` |
| GET | `/api/admin/cms/pages/:page` | `CmsController.page` |
| PATCH | `/api/admin/cms/sections/:id` | `CmsController.update` |
| POST | `/api/admin/cms/sections/:id/move` / `reset` | `CmsController` |
| GET, POST | `/api/admin/locations` | `LocationsController.list / create` |
| GET, PATCH, DELETE | `/api/admin/locations/:id` | `LocationsController.getById / update / remove` |
| GET, PUT | `/api/admin/locations/:id/menu` | `LocationsController.menu / saveMenu` |
| GET, PUT | `/api/admin/locations/:id/deals` | `LocationsController.deals / saveDeals` |
| GET, PUT | `/api/admin/settings` | `SettingsController.get / update` |
| GET | `/api/admin/jobs/field-values` | `JobsController.fieldValues` |
| GET, POST | `/api/admin/jobs` | `JobsController.list / create` |
| GET, PUT, DELETE | `/api/admin/jobs/:id` | `JobsController.getById / update / remove` |
| PATCH | `/api/admin/jobs/:id/status` | `JobsController.updateStatus` |
| GET, POST | `/api/admin/job-applications` | `JobApplicationsController.list / create` |
| GET, PUT, DELETE | `/api/admin/job-applications/:id` | `JobApplicationsController` |
| PATCH | `/api/admin/job-applications/:id/status` | `JobApplicationsController.updateStatus` |
| GET | `/api/admin/dashboard/stats` | `DashboardController.stats` |
| POST | `/api/admin/upload` | `UploadController.upload` |
| POST | `/api/admin/upload-media` | `UploadController.upload` | **Alias** handler, different size limit + tab |
| POST | `/api/admin/translate` | `TranslateController.translate` |

### Health (not under `/api`)

`GET /health`, `GET /health/ready`.

### Shared-handler aliases (intentional, not duplicates)

| Paths | Shared handler | Why |
|---|---|---|
| `GET /api/store/homepage` and `GET /api/store/cms/home` | `StoreController.content` | `/homepage` is a back-compat alias for the `home` CMS page |
| `POST /api/admin/upload` and `POST /api/admin/upload-media` | `UploadController.upload` | Same uploader; `/upload-media` allows 50 MB (video) and requires the `content` tab |

No route is registered twice. No dead/unreachable route was found.

---

## 3. Is any route called more than once (client side)?

Checked the callers in `client/`. Most calls are deduplicated. Findings:

| Route | Called from | Verdict |
|---|---|---|
| `GET /api/admin/auth/me` | `lib/admin/session.tsx` once per admin mount (`AdminSessionProvider`) | **Good.** The provider wraps the whole admin shell, so it does not refire on every navigation |
| `GET /api/admin/cms/pages` | `session.tsx` (in `refreshSession` and again in `acceptSession`) | **Minor.** Fires on mount and again after login. Not simultaneous, but the same endpoint is requested on two paths. Harmeful only as one extra round-trip |
| `GET /api/store/cms/site` | `lib/use-store-ordering.ts` | Requests both `?locale=en` and `?locale=ar` (2 calls) to build a locale bundle. **Deduplicated**: one shared in-flight promise + a 15–60 s cache, and the server-rendered seed skips the fetch entirely when fresh |
| `GET /api/menu/full` + `GET /api/menu/deals` | `redux/slices/menuSlice.ts` | Two separate calls on menu load (by design: catalogue and deals are different payloads) |
| `PATCH /api/store/location` | `lib/branch-selection.tsx` and `lib/use-store-locations.ts` | Two call sites, but only one fires per user action (branch pick). Not a double-call |
| Server components (`load-cms.ts`, `load-locations.ts`, `load-jobs.ts`) | Next `fetch(..., { next: { revalidate: 15 } })` wrapped in React `cache()` | **Good.** Per-request dedup + 15 s ISR |

**Conclusion:** no route is called repeatedly in a loop or fetched twice concurrently. The only redundancy is `/admin/cms/pages` firing on both session-restore and login, which is one extra request, not a pattern.

---

## 4. Caching — where it is and is not

There are **three cache layers**. Correctly, none of them touch quotes, orders, customers, or auth.

| Layer | Where | Scope | TTL |
|---|---|---|---|
| Shared read-through cache | `server/src/utils/cache.ts` (`cachedJson`) | Anonymous public reads only | Menu/locations/jobs 60 s, settings/CMS 120 s |
| HTTP `Cache-Control` | `server/src/index.ts` | Public GETs. Cookie-bound responses get `Vary: Cookie` | `max-age=60` / `30`, `stale-while-revalidate` |
| Client/edge | Next `revalidate: 15`, React `cache()`, `use-store-ordering` cache | Server components and ordering mode | 15–60 s |

Cache backend: in-process LRU by default; `CACHE_REDIS_URL` + `CACHE_REDIS_TOKEN` switch to a shared Upstash-style REST Redis so multiple instances share one cache.

**What is cached (public, anonymous, read-only):**

- `GET /api/menu/full`, `/menu/categories`, `/menu/items`, `/menu/deals`
- `GET /api/store/locations`, `/store/settings`, `/store/jobs`
- `GET /api/store/cms/:page` (incl. `/store/homepage`)

**What is never cached (correct):**

- `POST /api/menu/quote` and `POST /api/orders` (server prices every line)
- All `/api/admin/*` responses (personalised, per-role, per-branch)
- Anything keyed to `crispy_customer_id`
- Auth/session

Invalidation is wired to every write: menu/category/deal changes call `invalidateCatalogueCache()`, branch changes `invalidateLocationsCache()` + catalogue, settings `invalidateSettingsCache()`, CMS writes `invalidateCmsCache()`, job writes `invalidateJobsCache()`. A generation counter stops a pre-invalidation load from writing a stale value back.

**Two cache notes:**

- `getPublicCmsPage` has a double cache: the shared `cachedJson` **plus** an inner in-process `publicCache`/`rowCache` (15 s). That is fine (the inner maps coalesce concurrent misses) but it is two TTLs to reason about.
- Cache fills are forced to the **primary**, not the replica (`options?.cache ? false : options?.read`), so a cached value is never a lagging replica read. Good.

---

## 5. Read replica routing

`config/prisma.ts` exposes two clients: `getPrisma()` (primary) and `getReadPrisma()` (replica, falls back to primary when `NEON_READ_REPLICA_URL` is unset).

Only **anonymous, lag-tolerant public reads** pass `read: true`: the menu, deals, categories, items, locations, settings, jobs, and CMS public page. Everything after a write, in a transaction, priced, personalised, or admin-facing uses the primary. This split is correct.

---

## 6. Latency — which routes cost the most, and why

Ordered from most to least likely to feel slow as data grows. "Round-trips" = sequential DB queries on the hot path.

### Storefront (public)

| Route | Round-trips | Cached? | Why it costs what it costs |
|---|---|---|---|
| `GET /api/menu/full` | 2 (branch lookup + nested categories/items) | Yes (60 s) | One query with a nested `menu_items` + `branch_menu_items` include. Cheap after warm. Cold fill runs the join; fine at this data size |
| `GET /api/store/cms/:page` | 1 (+ inner row cache) | Yes (120 s) | One `cms_sections` query including translations. Cheap |
| `GET /api/store/locations` | 1 | Yes (60 s) | Bounded (`take: 500`). Cheap |
| `POST /api/menu/quote` | **5, in 2 parallel batches** | No | Batched by design (see below). A constant 5 queries (2 sequential waits) regardless of cart size |
| `POST /api/orders` | quote (5) + 1 transaction + re-read + **2 emails** | No | Re-runs the full quote at submit, writes order + items in one transaction, re-reads the saved order, then fires 2 emails (non-blocking `.catch(() => {})`). The DB work is bounded; the two Resend calls are the wall-clock tail but do not block the response |

`quoteCart` is the notable win: it prices a whole cart in **5 batched queries in 2 parallel batches** (location + products + deals, then the two branch-override lookups, all with `IN` lists), not two per line. Previously a 40-line cart was 81 sequential round-trips. That is now fixed. (The code comment says "four queries"; the actual count is 5 — 3 + 2 across two `Promise.all` batches, so 2 sequential round-trip waits.)

### Super admin

| Route | Round-trips | Why it costs what it costs |
|---|---|---|
| `GET /api/admin/dashboard/stats` | 1 transaction, 3 aggregates | `orders.groupBy(status)` + 2 `orders.aggregate(_sum total)` (all-time revenue, today's revenue). **This is the route that grows with order count.** The two `_sum` scans cover every matching order forever; `created_at` is indexed so "today" is bounded, but the all-time revenue sum scans all rows in scope. Superadmin scope = all branches |
| `GET /api/admin/orders` | 1 (list) + 1 (count) | `findMany` includes `order_items` for **every row on the page** and joins `location.name`. Payload grows with lines-per-order × page size. Count is a separate query in the same request |
| `GET /api/admin/customers` | 2 in a transaction | `_count.orders` + `take: 1` latest order per customer. Correctly bounded (not fetching all orders per customer) |
| `GET /api/admin/job-applications` | 1 + 1 (count) | Includes `job_post.title`. Fine |
| `GET /api/admin/jobs` | 1 + 1 (count) | Includes live branch name via relation. Fine |
| `GET /api/admin/menu` / `/:id` | 1 | `/:id` includes every stocking branch (`branch_menu_items` → `location`). Payload grows with branch count (9 now) |
| `GET /api/admin/staff` | 1 + 1 (count) | Includes branch assignments. Fine |
| `GET /api/admin/auth/me` | 1 | Runs on **every admin request** (auth middleware reloads the profile to use the live DB role). Single indexed lookup; cheap, but it is the one query every admin call pays |

### The one route to watch as data grows

**`GET /api/admin/dashboard/stats`.** It is the only endpoint whose cost scales with total historical rows (two unbounded `_sum` aggregates over `orders`). At nine branches and real order volume it is still fine, but it is the first one that will need attention. Options if it ever lags:

- Scope the all-time revenue sum with a date lower bound, or
- Maintain a running revenue counter on the branch/settings row and increment on order write, or
- Cache the stats for a few seconds (they do not need to be to-the-second).

Everything else is either cached (public reads), batched (quote), paginated (lists), or a single indexed lookup.

---

## 7. Query patterns — N+1 and batching

- **`quoteCart`** (`services/quote.service.ts`): batched into 5 queries (2 parallel batches) with `IN` lists + `Map` lookups. Was 2 queries per line. **Fixed.**
- **`getOrderById`** (`order.service.ts`): order + items + location name in **one** query (`include`). Comment in code notes it used to be two round-trips. **Fixed.**
- **`listCustomers`** (`customer.service.ts`): uses `_count.orders` and `take: 1` for the latest order instead of loading every order per customer. **Fixed.** Both reads in one transaction for a consistent page+count.
- **`getDashboardStats`**: one `groupBy` replaces a client-side count over a loaded list; 3 aggregates in one transaction. **Fixed.**
- **`loadFullMenu`** (`menu.service.ts`): reads the branch once (comment notes it used to read it twice per request). **Fixed.**
- **`createJobApplication` / `deleteJobApplication`**: the row write and the `applications` counter update share one transaction, so the counter cannot drift.

No active N+1 was found. The batching work is already done in the hot paths.

---

## 8. Indexes

Present and aligned with the query shapes (`server/prisma/schema.prisma`):

| Table | Indexes | Supports |
|---|---|---|
| `orders` | `(status, location_id)`, `(created_at)`, `(location_id, created_at)`, `(status, created_at)`, `(customer_id, created_at)` | Order list filters, dashboard "today", customer history, sort by `created_at desc, id desc` |
| `order_items` | `(order_id)`, `(menu_item_id)` | Line load per order |
| `menu_items` | `(category_id, active, sort_order)` | Nested menu query filter+sort |
| `deals` | `(active)` | Active deals |
| `branch_menu_items` / `branch_deals` | unique `(location_id, menu_item_id)` / `(location_id, deal_id)`, `(location_id, available)` | Branch menu join + quote override lookup |
| `job_posts` | `(status)`, `(type)`, `(location_id, created_at)`, `(location_id, status)` | Careers list + admin filters |
| `job_applications` | `(job_post_id)`, `(status)`, `(job_post_id, status)` | Application list + branch scope |
| `cms_sections` | unique `(page, key)`, `(page, is_active, sort_order)` | Public page load ordering |
| `cms_section_translations` | unique `(section_id, locale)` | Per-locale lookup |
| `customers`, `admin_profiles` | PK + `email @unique` | Auth, guest lookup |
| `admin_branch_access` | `@@id(admin_id, location_id)`, `(location_id)` | Branch scope checks |

The list sorts use `orderBy: [{ created_at: "desc" }, { id: "desc" }]` and are backed by `(…, created_at)` indexes. The `id` tiebreaker is deliberate (stable pagination). Good.

**No missing index** stands out for the current query set. The dashboard all-time `_sum` would benefit from a covering index only if the table gets large; until then a sequential scan on `orders.total` is acceptable.

---

## 9. Security and correctness notes (relevant to the backend)

- **Server-side pricing is enforced.** `quoteCart` ignores client prices; checkout re-quotes at submit. Client prices are never stored.
- **Auth is DB-backed per request.** `middleware/auth.ts` reloads the profile on every call and uses the **database** role, not the JWT's, so a deactivated account loses access before token expiry.
- **Branch scoping** is enforced in `branch-access.service.ts`; list routes filter in SQL (`allowedIds`), not after loading all rows.
- **Order ownership** is checked in Postgres (`email` + `customer_id` predicates), not in JS after the fact (comment notes this used to leak other customers' histories).
- **Rate limits**: global, a stricter auth limiter on login, an admin limiter, and separate higher allowances for `/menu/quote` and `/orders` (so a shared IP checking out does not get locked out). Public store GETs are exempt from the global limiter.
- **Uploads** are type-filtered (multer `fileFilter`) and size-capped (5 MB images, 50 MB video, 5 MB CV). The provider's error text is logged, not returned to the client.

---

## 10. Summary of findings

| Area | Status | Note |
|---|---|---|
| Cloudinary link stored | Correct | Only `secure_url` is saved; raw file never on disk |
| Orphaned Cloudinary images | Loose end | Replaced images are not deleted (no `deleteImage` call on replace) |
| Duplicate routes | None | Two intentional shared-handler aliases (documented above) |
| Repeated route calls | Essentially none | `/admin/cms/pages` fires on both session-restore and login (one extra call) |
| Caching | Correct and well-scoped | Public reads only; quotes/orders/admin never cached; invalidation on every write |
| Read replica | Correct | Only anonymous public reads; pricing/writes on primary |
| N+1 queries | None found | Quote, order detail, customers, dashboard already batched |
| Slowest route over time | `GET /api/admin/dashboard/stats` | Two unbounded `_sum` aggregates over all orders |
| Heaviest admin payload | `GET /api/admin/orders` | Includes `order_items` for every row on the page |
| Indexes | Adequate | Match the current query shapes |

### Recommended (optional) improvements

Status after the optimization pass (see [backend-optimizations.md](./backend-optimizations.md)):

1. **Delete replaced Cloudinary images** on menu/CMS image replacement to control storage cost (`deleteImage` already exists). **Still open.**
2. **Cache `GET /api/admin/dashboard/stats`** for a few seconds, or maintain a running revenue counter, if order volume makes the `_sum` scans slow. **Done:** 30s TTL cache keyed by branch scope, dropped on every order write.
3. **Merge the two `/admin/cms/pages` calls** in `session.tsx`. **Not needed:** the calls do not overlap in the real flow (the session provider does not remount across the post-login navigation).
4. **Trim `GET /api/admin/orders`** to not ship full `order_items` for list views. **Done:** the list now returns `item_count`; the detail endpoint still returns the lines.

None of these are blocking. The backend is in good shape: routes are clean and non-duplicated, the hot paths are batched, and caching is applied where it is safe.
