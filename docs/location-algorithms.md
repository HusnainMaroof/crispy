# Location Algorithms

> **Update:** Query resolution, ranking, and routing now run on the server.
> See `docs/location-search-api.md`. Sections 6 and 7 below describe the
> removed client-side resolver. They are kept for history only.

Every algorithm the location (branch) system runs, in pipeline order.
All paths are relative to the repo root.

| Stage | Runs on | Code |
| --- | --- | --- |
| Slug generation | API write | `server/src/utils/slug.ts` |
| Database read | API | `server/src/services/admin.service.ts` |
| Cache | API | `server/src/utils/cache.ts` |
| Row mapping | Browser | `client/lib/storefront-locations.ts` |
| Status derivation | Browser | `client/lib/storefront-locations.ts` |
| Coverage index build | Offline script | `client/scripts/generate-location-coverage.mjs` |
| Query resolution | Browser | `client/lib/location-search.ts` |
| Distance ranking | Browser | `client/lib/location-search.ts` |
| Branch selection | Browser | `client/lib/branch-selection.tsx` |
| Map viewport | Browser | `client/app/components/store/locations-map.tsx` |
| Hours parse/format | Admin only | `client/lib/admin/shop-hours.ts` |
| Address/hours translation | Browser | `client/lib/i18n/index.ts` |

---

## 1. Slug generation

A branch name becomes a URL-safe key once, at creation time.
Nothing queries by slug at runtime except tests and seed scripts.

`server/src/utils/slug.ts:3-17`

```ts
export function slugifyBranchName(name: string): string {
  const slug = name
    .normalize("NFKD")                        // 1. decompose accents
    .replace(/[\u0300-\u036f]/g, "")          // 2. drop combining marks
    .toLowerCase()                            // 3. lowercase
    .replace(/&/g, " and ")                   // 4. ampersand to word
    .replace(/[^a-z0-9]+/g, "-")              // 5. runs of invalid -> single dash
    .replace(/^-+|-+$/g, "");                 // 6. trim dashes

  if (!slug) {
    throw new BadRequestException("Branch name cannot be turned into a slug");
  }
  return slug;
}
```

Step 1 and 2 together mean `Café` becomes `cafe`, not `caf`. Step 4 means
`Elephant & Castle` becomes `elephant-and-castle`, not `elephant-castle`.

Called on create only, and only when the caller did not supply a slug.
`server/src/services/admin.service.ts:81-99`

```ts
export async function createLocation(input: Record<string, unknown>): Promise<Location> {
  const name = typeof input.name === "string" ? input.name : "";
  const slug = typeof input.slug === "string" && input.slug.length > 0
    ? input.slug
    : slugifyBranchName(name);
  const row = await db().locations.create({
    data: {
      ...(input as Prisma.locationsUncheckedCreateInput),
      id: crypto.randomUUID(),
      slug,
      sort_order: 0,
    },
  });
  void invalidateLocationsCache();
  void invalidateCatalogueCache();
  return serialize(row);
}
```

The primary key is a random UUID, not the slug. This matters in section 8.

The same function builds staff URL segments.
`server/src/controllers/admin/auth.controller.ts:17-29`

```ts
function personSlug(name: string) {
  try {
    return slugifyBranchName(name);
  } catch {
    return "team";
  }
}

function homeFor(role: string, name: string, branches: { slug: string }[], tabs: string[]) {
  const slug = branches[0]?.slug;
  const normalized = normalizeRole(role);
  const base = normalized === "branch_manager" && slug ? `/${slug}/admin`
    : normalized === "staff" && slug ? `/${slug}/${personSlug(name)}` : "/super-admin";
```

### The SQL backfill is a weaker slugifier

The migration that added the column used plain Postgres regex, no `&` expansion
and no accent handling. `Elephant & Castle` collapsed to `elephant-castle`,
which had to be corrected by hand in a later seed.

`server/prisma/migrations/20260927120000_branch_foundation/migration.sql:74-102`

```sql
-- Backfill slugs from branch names. Do not suffix collisions.
UPDATE "locations"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

DO $$
DECLARE
  collisions text;
BEGIN
  SELECT string_agg(slug || ' x' || cnt::text, ', ')
  INTO collisions
  FROM (
    SELECT slug, COUNT(*) AS cnt
    FROM "locations"
    WHERE slug IS NOT NULL AND slug <> ''
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) duplicated;

  IF collisions IS NOT NULL THEN
    RAISE EXCEPTION 'location slug collision: %', collisions;
  END IF;

  IF EXISTS (SELECT 1 FROM "locations" WHERE slug IS NULL OR slug = '') THEN
    RAISE EXCEPTION 'location slug backfill left an empty slug';
  END IF;
END $$;

CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");
```

The migration fails loudly on a duplicate slug rather than silently appending a
suffix. So slugs stay stable and are safe to use as keys.

Runtime validation is a shape check, not a normaliser.
`server/src/validators/order.schema.ts:33`

```ts
const branchSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
```

---

## 2. Database read

There is no server-side search. The list endpoint filters on `status` and
`id IN (...)` and nothing else.

`server/src/services/admin.service.ts:40-65`

```ts
export async function getLocations(options?: LocationsReadOptions): Promise<Location[]> {
  const load = () => loadLocations(options?.cache ? { ...options, read: false } : options);
  // The public branch list is anonymous, cookie-free, and changes rarely.
  if (options?.cache && !options?.allowedIds) {
    return cachedJson(`locations:${options.activeOnly ? "active" : "all"}`, TTL_LOCATIONS_SECONDS, load);
  }
  return load();
}

async function loadLocations(options?: LocationsReadOptions): Promise<Location[]> {
  const rows = await db(options?.read).locations.findMany({
    where: {
      ...(options?.activeOnly ? { status: "active" } : {}),
      ...(options?.allowedIds ? { id: { in: options.allowedIds } } : {}),
    },
    orderBy: { sort_order: "asc" },
    take: options?.limit ?? 500,
  });
  return serialize(rows);
}

export async function getLocationById(id: string, options?: { read?: boolean }): Promise<Location> {
  const row = await db(options?.read).locations.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Location not found");
  return serialize(row);
}
```

Notes:

- No `contains`, no `mode: "insensitive"`, no `lat`/`lng` predicate.
- The storefront passes no `activeOnly`, so inactive branches are returned and
  the client turns them into `closed` rather than hiding them.
- Line 41: when `cache` is on, `read` is forced to `false`, so a cache fill
  always hits the primary and never the replica. Otherwise a branch created
  moments ago could be invisible for the TTL.

### Read routing

`read: true` sends lag-tolerant public reads to the replica. Default is primary.
`server/src/services/admin.service.ts:21-24`

```ts
/** `read` routes lag-tolerant public reads to the replica. Default: primary. */
function db(read?: boolean) {
  return read ? getReadPrisma() : getPrisma();
}
```

### Decimal to number

`lat` and `lng` are `Decimal(10,7)` in Postgres. They reach the browser as plain
numbers because every row goes through a recursive converter.
`server/src/utils/db.ts:5-27`

```ts
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
  return value.constructor?.name?.startsWith("Decimal") === true
    && "toNumber" in value
    && typeof value.toNumber === "function";
}
```

### No geo index

`lat` and `lng` are plain decimals. There is no `geography` type, no `point`,
no GiST index, no `postgis` or `earthdistance` extension anywhere in the repo.
All distance maths happens in the browser.

`server/prisma/schema.prisma:70-94`

```prisma
model locations {
  id                       String                @id
  name                     String
  slug                     String?               @unique
  address                  String
  postcode                 String?
  city                     String?
  hours                    String
  phone                    String
  lat                      Decimal?              @db.Decimal(10, 7)
  lng                      Decimal?              @db.Decimal(10, 7)
  status                   String                @default("active")
  delivery_enabled         Boolean               @default(true)
  collection_enabled       Boolean               @default(true)
  delivery_fee             Decimal?              @db.Decimal(10, 2)
  free_delivery_threshold  Decimal?              @db.Decimal(10, 2)
  sort_order               Int                   @default(0)
  created_at               DateTime              @default(now())
  updated_at               DateTime              @updatedAt
  orders                   orders[]
  branch_menu_items        branch_menu_items[]
  branch_deals             branch_deals[]
  admin_branch_access      admin_branch_access[]
  job_posts                job_posts[]
}
```

---

## 3. Cache

Two layers. One in the API process, one in the HTTP response.

### Read-through cache

Single-flight per key, so a burst of misses hits Postgres once.
`server/src/utils/cache.ts:132-186`

```ts
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
```

The generation guard is the important part. A load that started before an admin
edit holds the pre-edit value; without the guard it would write that stale value
back into the cache after the invalidation had already run.

A cache failure never fails the request. The loader still runs.

Backend is Redis over REST when configured, otherwise an in-process LRU.
`server/src/utils/cache.ts:112-130`

```ts
function resolveBackend(): CacheBackend {
  const url = process.env.CACHE_REDIS_URL;
  const token = process.env.CACHE_REDIS_TOKEN;
  if (url && token) return new RedisRestCache(url, token);
  return new LruCache();
}
```

Invalidation on any branch write. `server/src/utils/cache.ts:229-233`

```ts
/** A branch row changed (create, update, deactivate). */
export function invalidateLocationsCache(): Promise<void> {
  bump("locations:");
  return fire(() => getCache().delByPrefix("locations:"));
}
```

TTLs. `server/src/utils/cache.ts:188-195`

```ts
export const TTL_MENU_SECONDS = 60;
export const TTL_LOCATIONS_SECONDS = 60;
export const TTL_JOBS_SECONDS = 60;
export const TTL_SETTINGS_SECONDS = 120;
export const TTL_CMS_SECONDS = 120;
```

### HTTP cache

The endpoint is publicly cacheable but must never vary by visitor.
`server/src/index.ts:101-137`

```ts
const PUBLIC_MAX_AGE = "public, max-age=60, stale-while-revalidate=120";
const PUBLIC_COOKIE_MAX_AGE = "public, max-age=30, stale-while-revalidate=60";
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const path = req.path;
  const cookieFree =
    path === "/api/menu/categories" ||
    path === "/api/menu/items" ||
    path === "/api/store/locations" ||
    /^\/api\/store\/locations\/[^/]+$/.test(path) ||
    path === "/api/store/settings" ||
    path === "/api/store/jobs";
  const cookieBound =
    path === "/api/menu/full" ||
    path === "/api/menu/deals" ||
    path === "/api/store/homepage" ||
    /^\/api\/store\/cms\/[^/]+$/.test(path);
  if (res.getHeader("Set-Cookie")) {
    res.setHeader("Cache-Control", "private, no-store");
    return next();
  }
  if (cookieFree) {
    res.setHeader("Cache-Control", PUBLIC_MAX_AGE);
  } else if (cookieBound) {
    res.append("Vary", "Cookie");
    res.setHeader("Cache-Control", PUBLIC_COOKIE_MAX_AGE);
  }
  next();
});
```

`/api/store/locations` is in the `cookieFree` set, so a shared CDN cache can
serve it to anyone. The `Set-Cookie` guard above it is what stops a guest id
cookie from being cached and handed to the next visitor.

### Next.js layer

Server components fetch with ISR on top of the API cache.
`client/lib/load-locations.ts:4-19`

```ts
export const loadStoreLocations = cache(async (): Promise<StoreLocationCard[]> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/locations`, { next: { revalidate: 15 } });
    if (!res.ok) return [];
    const body = await res.json() as { data?: unknown };
    if (!Array.isArray(body.data)) return [];
    return body.data.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const location = mapStoreLocation(row as Record<string, unknown>);
      return location ? [toStoreLocationCard(location)] : [];
    });
  } catch {
    return [];
  }
});
```

`cache()` from React dedupes within a single render. `revalidate: 15` bounds
staleness to 15 seconds at the Next layer.

---

## 4. Row mapping

Raw API row to a validated `Location`. Bad rows are dropped, not thrown on.

`client/lib/storefront-locations.ts:17-36`

```ts
export function mapStoreLocation(raw: Record<string, unknown>): Location | null {
  if (typeof raw.id !== "string" || !raw.id || typeof raw.name !== "string" || !raw.name.trim()) return null;
  return {
    id: raw.id,
    name: raw.name,
    address: typeof raw.address === "string" ? raw.address : "",
    hours: typeof raw.hours === "string" ? raw.hours : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    status: typeof raw.status === "string" ? raw.status : "active",
    lat: coord(raw.lat),
    lng: coord(raw.lng),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : 0,
  };
}

function coord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
```

`coord` accepts a numeric string, because a `Decimal` can serialise as a string
depending on the driver. `Number.isFinite` rejects `NaN` and `Infinity`, so a
broken coordinate becomes `null` rather than poisoning distance maths.

A row is dropped only if `id` or `name` is missing or blank. Everything else
degrades to a safe default.

Note what is discarded here: `postcode`, `city`, and `slug` from the DB row are
never read on this path. The postcode on the card is re-derived from the address
text, see below.

---

## 5. Status derivation

This is the algorithm that decides what the status pill says.

`client/lib/storefront-locations.ts:38-62`

```ts
export function toStoreLocationCard(location: Location): StoreLocationCard {
  const hours = location.hours?.trim() ?? "";
  const address = typeof location.address === "string" ? location.address : "";
  // "Coming Soon" in the hours is how a branch that is not open yet is marked.
  // It is its own state: the branch still shows on the site, just not as open.
  const comingSoon = /coming soon/i.test(hours);
  const status =
    location.status === "inactive" || hours.length === 0
      ? "closed"
      : comingSoon
        ? "coming_soon"
        : "open";
  const match = address.toUpperCase().match(EMBEDDED_POSTCODE);
  return {
    id: location.id,
    name: location.name,
    address,
    postcode: match ? `${match[1]} ${match[2]}` : "",
    status,
    hours: hours || "—",
    lat: location.lat,
    lng: location.lng,
    phone: location.phone,
  };
}
```

Decision order, first match wins:

```
1. locations.status === "inactive"   OR   trim(hours) === ""   ->  "closed"
2. /coming soon/i matches hours text                            ->  "coming_soon"
3. otherwise                                                    ->  "open"
```

Two things to be clear about:

- **There is no clock.** No code in this repo parses an hours string and compares
  it to the current time. A branch with hours `9:00 AM – 11:00 PM` reads as
  `open` at 3am. The pill means "this branch is listed and tradeable", not
  "the doors are open right now".
- **Coming soon is a magic string, not a column.** It lives in `hours`. Admin
  writes it as `hours: "Coming Soon"`, and `/coming soon/i` picks it back out.

### Postcode extraction

The card's postcode is regexed out of the free-text address, not read from the
`locations.postcode` column.

`client/lib/storefront-locations.ts:3`

```ts
const EMBEDDED_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
```

`\b` anchors so it does not fire mid-word. Case-insensitive flag, so the input
is uppercased first at line 50 purely for readability. A miss gives `""`, never
`undefined`.

### Where the admin writes Coming Soon

`client/app/super-admin/locations/page.tsx:32-41`

```ts
const setComingSoon = async (location: AdminLocation) => {
  try {
    // A coming soon branch stays listed (status active), it just shows as
    // Coming Soon until real hours are set.
    await updateLocation(location.id, { hours: "Coming Soon", status: "active" });
    toast.success(`${location.name} is marked Coming Soon`);
  } catch {
    toast.error("Could not update branch status");
  }
};
```

New branches from the form default to it, `client/app/super-admin/locations/page.tsx:199`:

```ts
onSave({ name, address, phone, hours: "Coming Soon" });
```

Going from Coming Soon back to active demands real hours.
`client/app/super-admin/locations/page.tsx:117-140`

```tsx
onChange={(value) => {
  if (value === "coming_soon") {
    if (!comingSoon) void setComingSoon(location);
    return;
  }
  if (value === "active" && comingSoon) {
    // Opening a branch needs real hours, so finish in the edit form.
    toast("Set the opening hours to open this branch");
    setEditing(location);
    return;
  }
  const next = value === "inactive" ? "inactive" : "active";
  if (next === location.status) return;
  void setStatus(location, next);
}}
```

A branch can never be marked open while its hours still say Coming Soon.

### Colour and label mapping

`client/app/components/store/locations.tsx:213-228`

```tsx
const statusBg =
  loc.status === "coming_soon" ? "bg-[#6B6B6B]"
  : loc.status === "closed" ? "bg-[#8B6F5E]"
  : isActive ? "bg-[#1F5C2E]" : "bg-[#6FA06A]";
const statusDot =
  loc.status === "coming_soon" ? "bg-[#D9D9D9]"
  : loc.status === "closed" ? "bg-[#C9A892]"
  : isActive ? "bg-[#7CFF8A]" : "bg-[#C8F0C0]";
```

Labels come from i18n, `client/lib/i18n/index.ts:396-398` and `:658-660`.

```
"locations.openNow":   "Open Now"      /  "مفتوح الآن"
"locations.closed":    "Closed"        /  "مغلق"
"locations.comingSoon": "Coming Soon"  /  "قريباً"
```

---

## 6. Coverage index, built offline

`client/lib/location-coverage.json` is a precomputed map of UK postcode
districts to the nearest branch, so most searches need no network call.

Current contents:

| Key | Shape | Count |
| --- | --- | --- |
| `radiusMiles` | `50` | 1 |
| `generatedAt` | `2026-09-11T07:52:59.828Z` | 1 |
| `branches` | hardcoded list, 9 entries | 9 |
| `outcodes` | district centre to nearest branch | 714 |
| `postcodes` | the 9 branch postcodes only | 9 |

Sample entries:

```json
"W9":   { "lat": 51.52341,  "lng": -0.19629, "branchId": "harrow-road", "miles": 0 }
"EC3N": { "lat": 51.5092,   "lng": -0.0784,  "branchId": "tower-hill",  "miles": 0 }
"NW6":  { "lat": 51.5442,   "lng": -0.20036, "branchId": "kilburn",     "miles": 0 }
```

```json
"W92HU":   { "branchId": "harrow-road", "postcode": "W9 2HU" }
"EC3N4EE": { "branchId": "tower-hill",  "postcode": "EC3N 4EE" }
"NW62DB":  { "branchId": "kilburn",     "postcode": "NW6 2DB" }
```

### The build algorithm: seeded breadth-first expansion

`client/scripts/generate-location-coverage.mjs:88-177`

```js
function haversineMiles(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestBranch(lat, lng, branches) {
  let best = null;
  let bestMiles = Number.POSITIVE_INFINITY;
  for (const branch of branches) {
    const miles = haversineMiles(lat, lng, branch.lat, branch.lng);
    if (miles < bestMiles) {
      best = branch;
      bestMiles = miles;
    }
  }
  return { branch: best, miles: bestMiles };
}
```

The expansion. Seed with each branch's own district, then walk outward.

```js
function addOutcode(outcode, lat, lng) {
  const key = String(outcode).toUpperCase();
  if (seen.has(key)) return;
  seen.add(key);
  const { branch, miles } = nearestBranch(lat, lng, branches);
  if (!branch || miles > RADIUS_MILES) return;
  outcodes[key] = {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    branchId: branch.id,
    miles: Number(miles.toFixed(2)),
  };
  queue.push(key);
}

for (const branch of branches) {
  addOutcode(branch.outcode, branch.lat, branch.lng);
}

while (queue.length) {
  const current = queue.shift();
  const body = await getJson(
    `${API}/outcodes/${encodeURIComponent(current)}/nearest?limit=100&radius=25000`,
  );
  const results = Array.isArray(body?.result) ? body.result : [];
  for (const row of results) {
    if (!row?.outcode) continue;
    addOutcode(row.outcode, row.latitude, row.longitude);
  }
  await sleep(60);
}
```

Properties of this approach:

- **Seeded BFS**, not a scan. It starts at the nine branch districts and asks
  postcodes.io for the 100 nearest districts within 25km of each one. It never
  enumerates the whole UK.
- **The radius filter prunes the frontier.** A district further than 50 miles
  from every branch is discarded and never expanded, so the search stays bounded.
- **Deduplication is by outcode key**, uppercased.
- **Coordinates are rounded to 5dp** (~1.1m at the equator) and distance to 2dp,
  which keeps the file small.
- **`sleep(60)`** between calls, because postcodes.io rate-limits.
- **`miles: 0` for the seed districts** is expected, the seed coordinates are the
  branch coordinates.

Coverage depends on the branch list being current. Add a branch and rerun the
script, otherwise its district is not in the index and searches there fall
through to the network path in section 7.

---

## 7. Query resolution

`client/lib/location-search.ts` is the whole engine. It runs in the browser.
No server call is involved in the match itself, only in geocoding.

### 7.1 Normalization

Lowercase, ampersand to "and", strip punctuation, collapse whitespace.
Case-insensitive by construction.
`client/lib/location-search.ts:79-95`

```ts
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function compactPostcode(raw: string) {
  return raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function formatPostcode(raw: string) {
  const compact = compactPostcode(raw);
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}
```

`normalize` is used for text matching. `compactPostcode` is separate and
deliberately keeps letters and digits only, because `W9 2HU` and `w92hu` must
compare equal.

### 7.2 Postcode recognition

Four regexes decide whether a query is a postcode.
`client/lib/location-search.ts:37-43`

```ts
const EARTH_RADIUS_MILES = 3958.8;
const FULL_UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;
const OUTWARD_UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const EMBEDDED_FULL_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/;
const US_ZIP = /^\d{5}(?:-?\d{4})?$/;
```

`FULL_UK_POSTCODE` captures the outward code and the inward code as groups 1
and 2. `US_ZIP` exists only to reject US input early with a helpful message.

`parseUkPostcode` tries four strategies in order.
`client/lib/location-search.ts:97-146`

```ts
export function parseUkPostcode(query: string): ParsedPostcode | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const compactWhole = compactPostcode(trimmed);
  const fullWhole = compactWhole.match(FULL_UK_POSTCODE);
  if (fullWhole) {
    return {
      compact: compactWhole,
      formatted: `${fullWhole[1]} ${fullWhole[2]}`,
      outcode: fullWhole[1],
      full: true,
    };
  }

  const upper = trimmed.toUpperCase();
  const embedded = upper.match(EMBEDDED_FULL_POSTCODE);
  if (embedded) {
    const compact = `${embedded[1]}${embedded[2]}`;
    return { compact, formatted: `${embedded[1]} ${embedded[2]}`, outcode: embedded[1], full: true };
  }

  if (OUTWARD_UK_POSTCODE.test(compactWhole)) {
    return { compact: compactWhole, formatted: compactWhole, outcode: compactWhole, full: false };
  }

  const tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    if (OUTWARD_UK_POSTCODE.test(token) && outcodeIndex[token]) {
      return { compact: token, formatted: token, outcode: token, full: false };
    }
  }

  return null;
}
```

The four passes:

1. Whole query compacted, then matched against the full pattern. `W92HU`, `w9 2hu`.
2. Uppercased query scanned for an embedded full postcode. Catches `my area W9 2HU`.
3. Whole compacted query matched against the outward-only pattern. `W9`, `NW6`.
4. Each token tested against the outward pattern, and only accepted if it is
   also present in the coverage index. This avoids treating a bare `A1` as a
   district when it is not one.

`full` distinguishes "this is a complete postcode" from "this is only a
district". It steers the cascade in 7.6.

### 7.3 Edit distance

Classic two-row Levenshtein, then normalised to a 0 to 1 similarity.
`client/lib/location-search.ts:148-173`

```ts
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}
```

Two rolling rows instead of a full matrix, so memory is O(b) not O(a*b). Dividing
by the longer string makes the score length-independent: `1 - d/maxLen` gives
0.75 for one wrong character in a four letter word, and about 0.9 for one wrong
character in a ten letter word.

### 7.4 Token extraction

`client/lib/location-search.ts:45-181`

```ts
const IGNORE_ADDRESS_TOKENS = new Set([
  "london", "road", "rd", "high", "unit", "station", "terrace",
  "lambeth", "westminster", "castle", "the", "and", "street", "st",
  "avenue", "ave", "lane", "close", "drive", "way", "place", "square",
]);
```

```ts
function branchTokens(branch: SearchBranch) {
  const nameWords = normalize(branch.name).split(" ").filter(Boolean);
  const addressWords = normalize(branch.address)
    .split(" ")
    .filter((word) => word.length >= 3 && !IGNORE_ADDRESS_TOKENS.has(word));
  return { nameWords, addressWords, name: normalize(branch.name) };
}
```

Name words are all kept. Address words drop anything shorter than 3 characters
and any stopword. Without the stopword list, typing `road` would fuzzy-match
every single branch in London, since `412 Harrow Road`, `340 Edgware Rd` and
`253 Station Rd` all contain it.

Only `name` and `address` are searched here. `postcode` is on the type but
never read by this function.

### 7.5 The scored text matcher

This is the core of name and address search.
`client/lib/location-search.ts:188-264`

```ts
export function findBranchTextMatch(
  branches: SearchBranch[],
  query: string,
): BranchTextMatch | null {
  const q = normalize(query);
  if (!q || q.length < 2) return null;

  const qCompact = q.replace(/\s+/g, "");
  const qTokens = q.split(" ").filter((token) => token.length >= 2);

  let best: BranchTextMatch | null = null;

  for (const branch of branches) {
    const { nameWords, addressWords, name } = branchTokens(branch);
    const nameCompact = name.replace(/\s+/g, "");
    const candidates: BranchTextMatch[] = [];

    if (name === q) {
      candidates.push({ branch, kind: "exact", score: 400 });
    }

    if (name.includes(q) || q.includes(name)) {
      candidates.push({ branch, kind: "strong", score: 280 });
    }

    for (const word of nameWords) {
      if (word.startsWith(q) || q.startsWith(word)) {
        candidates.push({ branch, kind: "strong", score: 240 });
      }
    }

    for (const qToken of qTokens) {
      if (qToken.length < 3) continue;

      if (nameWords.some((word) => word.includes(qToken) || qToken.includes(word))) {
        candidates.push({ branch, kind: "partial", score: 220 });
      }

      for (const word of nameWords) {
        const sim = similarity(word, qToken);
        if (sim >= 0.72) {
          candidates.push({ branch, kind: "partial", score: 200 + sim * 40 });
        }
      }

      for (const word of addressWords) {
        if (word.includes(qToken) || qToken.includes(word)) {
          candidates.push({ branch, kind: "partial", score: 185 });
        }
      }
    }

    if (qCompact.length >= 4) {
      const nameSim = similarity(nameCompact, qCompact);
      if (nameSim >= 0.68) {
        candidates.push({ branch, kind: "fuzzy", score: 160 + nameSim * 80 });
      }

      for (const word of [...nameWords, ...addressWords]) {
        if (word.length < 4) continue;
        const wordSim = similarity(word, qCompact);
        if (wordSim >= 0.74) {
          candidates.push({ branch, kind: "fuzzy", score: 150 + wordSim * 70 });
        }
      }
    }

    for (const candidate of candidates) {
      if (candidate.score > (best?.score ?? 0)) {
        best = candidate;
      }
    }
  }

  if (!best || best.score < 150) return null;
  return best;
}
```

Every rule is additive. All eight fire for every branch, collect into
`candidates`, and the highest score wins globally. Nothing short-circuits, so a
branch can be promoted from partial to fuzzy within a single pass.

The score ladder:

| Rule | Kind | Score |
| --- | --- | --- |
| normalized name equals query | exact | 400 |
| name contains query, or query contains name | strong | 280 |
| any name word prefix-matches the query | strong | 240 |
| any name word contains a query token | partial | 220 |
| word similarity >= 0.72 against a query token | partial | 200 + sim * 40 |
| address word contains a query token, stopwords removed | partial | 185 |
| whole-name similarity >= 0.68, query >= 4 chars | fuzzy | 160 + sim * 80 |
| word similarity >= 0.74, query >= 4 chars | fuzzy | 150 + sim * 70 |

Guard rails and why each exists:

| Guard | Reason |
| --- | --- |
| reject query under 2 chars | one letter matches too much |
| skip query tokens under 3 chars | `ha` would hit Harrow, Harrow Road and Harlesden |
| require 4+ chars for whole-query fuzzy | short strings produce meaningless similarity scores |
| require 4+ chars on the fuzzy target word | same reason on the other side |
| reject below 150 | only the two fuzzy rules can score that low, so this admits fuzzy matches but rejects noise |
| strictly greater comparison | ties keep the earlier branch in array order, which is `sort_order` from the database |

The fuzzy scores overlap the partial band on purpose. `160 + sim*80` spans 160
to 240, so a very strong whole-name fuzzy outranks a weak word partial. The
score, not the `kind` label, is what orders results.

Worked examples against real branch data:

| Query | Path | Result |
| --- | --- | --- |
| `Kilburn` | name === q, 400 | Kilburn |
| `kilb` | word prefix `kilburn`.startsWith(`kilb`), 240 | Kilburn |
| `Kilbrun` | 1 edit in 7 chars, sim 0.857, 200 + 34.3 = 234.3 | Kilburn |
| `harrow rd` | token `harrow` in name, 220 | Harrow Road |
| `Harrow` | matches Harrow at 400 and Harrow Road at 220 | Harrow |
| `road` | stopword removed from address, name match only | nothing, below 150 |
| `a` | query under 2 chars | null |

That last pair is the whole reason for the stopword list.

### 7.6 The cascade

`resolveNearestBranch` tries strategies in a fixed order and returns on the
first that produces an answer.
`client/lib/location-search.ts:508-626`

```ts
export async function resolveNearestBranch(
  query: string,
  branches: SearchBranch[],
  radiusMiles = SEARCH_RADIUS_MILES,
): Promise<NearestBranchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { error: "Enter an area or postcode to search." };
  }

  if (US_ZIP.test(trimmed.replace(/\s+/g, ""))) {
    return {
      error: "Please enter a UK postcode such as W9 2HU, or an area like Kilburn.",
    };
  }

  const parsed = parseUkPostcode(trimmed);
  const textMatch = parsed?.full ? null : findBranchTextMatch(branches, trimmed);
```

Two early exits: an empty query, and a US ZIP, which is rejected with guidance
rather than silently failing.

Then the strong text match short-circuits. A full postcode never gets a text
match computed for it, because `W9 2HU` should not fuzzy-match a branch name.
`client/lib/location-search.ts:527-536`

```ts
  if (
    textMatch &&
    (textMatch.kind === "exact" ||
      textMatch.kind === "strong" ||
      (textMatch.kind === "fuzzy" && textMatch.score >= 210))
  ) {
    return resultFromTextMatch(textMatch, trimmed);
  }
```

Exact, strong, or a fuzzy at 210 or above, meaning roughly `sim >= 0.625` on
whole-name fuzzy, or the high end of the word partial band. A weak fuzzy is
held back in case a postcode or geocode finds something better.

Branch A, full postcode. `client/lib/location-search.ts:537-578`

```ts
  if (parsed?.full) {
    const exact = exactPostcodes[parsed.compact];
    const exactBranch = exact ? branchById(branches, exact.branchId) : null;
    // A postcode inside a coming soon branch answers right away only when that
    // branch is open. Otherwise the search first looks for an open branch.
    if (exactBranch && !exactBranch.comingSoon) {
      return {
        branch: exactBranch,
        distanceMiles: 0,
        searchedLabel: exact.postcode,
        via: "postcode",
      };
    }

    try {
      const coords = await lookupPostcode(parsed.formatted);
      if (coords) {
        const geo = await resultFromCoords(branches, coords, radiusMiles);
        if (geo) return geo;
      }
    } catch {
      /* fall through to the local outcode index */
    }

    const local = resultFromLocalOutcode(branches, parsed, radiusMiles);
    if (local) return local;

    if (textMatch) return resultFromTextMatch(textMatch, trimmed);

    // Nothing open nearby: the branch for this postcode is still the answer.
    if (exact && exactBranch) {
      return {
        branch: exactBranch,
        distanceMiles: 0,
        searchedLabel: exact.postcode,
        via: "postcode",
      };
    }

    return {
      error: `No Crispies within ${radiusMiles} miles of ${parsed.formatted}. Try another area or postcode.`,
    };
  }
```

Order: local exact hit, then network geocode, then local outcode centre, then
text match, then the coming soon branch as a last resort. So the exact postcode
of a tradeable branch answers with no network at all. The coming soon branch is
deliberately demoted to fourth, so a customer near a coming soon branch is
pointed at an open one when there is one.

Branch B, outcode only. `client/lib/location-search.ts:580-590`

```ts
  if (parsed && !parsed.full) {
    const local = resultFromLocalOutcode(branches, parsed, radiusMiles);
    if (local) return local;

    try {
      const coords = await lookupOutcode(parsed.outcode);
      if (coords) {
        const geo = await resultFromCoords(branches, coords, radiusMiles);
        if (geo) return geo;
      }
    } catch {
      /* ignore */
    }
  }
```

Local index first, network second.

Branch C, free text that is not a postcode.
`client/lib/location-search.ts:591-626`

```ts
  try {
    const place = await lookupPlace(trimmed);
    if (place) {
      const geo = await resultFromCoords(branches, place, radiusMiles);
      if (geo && !("error" in geo)) return geo;
      if (textMatch) return resultFromTextMatch(textMatch, trimmed);
      if (geo) return geo;
    }
  } catch {
    /* ignore */
  }

  try {
    const coords = await lookupNominatim(trimmed);
    if (coords) {
      const geo = await resultFromCoords(branches, coords, radiusMiles);
      if (geo && !("error" in geo)) return geo;
      if (textMatch) return resultFromTextMatch(textMatch, trimmed);
      if (geo) return geo;
    }
  } catch {
    /* ignore */
  }

  if (textMatch) {
    return resultFromTextMatch(textMatch, trimmed);
  }

  return {
    error: `No Crispies within ${radiusMiles} miles of that area. Try another town, city, or UK postcode.`,
  };
```

postcodes.io `/places`, then OpenStreetMap Nominatim, then the text match. Both
network steps prefer a branch in range over a text suggestion, but a text match
still beats a "nothing nearby" error.

### The full cascade as a table

| Order | Condition | Source | Network |
| --- | --- | --- | --- |
| 1 | query empty | error | no |
| 2 | looks like a US ZIP | error with guidance | no |
| 3 | text match is exact, strong, or fuzzy >= 210 | branch list | no |
| 4 | full postcode, exact hit, branch not coming soon | coverage index | no |
| 5 | full postcode, geocode, branch in radius | postcodes.io | yes |
| 6 | full postcode, district centre, branch in radius | coverage index | no |
| 7 | full postcode, text match | branch list | no |
| 8 | full postcode, coming soon branch as fallback | coverage index | no |
| 9 | full postcode, nothing found | error | 1 call |
| 10 | outcode, district centre, branch in radius | coverage index | no |
| 11 | outcode, geocode, branch in radius | postcodes.io | yes |
| 12 | place name, branch in radius | postcodes.io | yes |
| 13 | place name, text match | branch list | no |
| 14 | Nominatim, branch in radius | OSM | yes |
| 15 | Nominatim, text match | branch list | no |
| 16 | text match | branch list | no |
| 17 | nothing | error | up to 3 calls |

Steps 3 and 4 cover the overwhelming majority of real searches with zero network
calls.

### 7.7 Geocoding providers

Four lookups, all in the browser.

Exact postcode. `client/lib/location-search.ts:266-284`

```ts
async function lookupPostcode(postcode: string): Promise<GeocodeResult | null> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    status?: number;
    result?: { latitude: number; longitude: number; postcode: string };
  };
  if (body.status !== 200 || !body.result) return null;
  return {
    lat: body.result.latitude,
    lng: body.result.longitude,
    label: body.result.postcode,
  };
}
```

District centre, `client/lib/location-search.ts:287-306` hits
`/outcodes/{outcode}`.

Place name with ranked hit selection. `client/lib/location-search.ts:308-345`

```ts
async function lookupPlace(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ q: query, limit: "5" });
  const res = await fetch(`https://api.postcodes.io/places?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    result?: Array<{
      name_1?: string;
      latitude: number;
      longitude: number;
      outcode?: string;
      region?: string;
      county_unitary?: string;
    }>;
  };

  const hits = Array.isArray(body.result) ? body.result : [];
  const q = normalize(query);

  const hit =
    hits.find((place) => normalize(place.name_1 ?? "") === q) ??
    hits.find((place) => {
      const name = normalize(place.name_1 ?? "");
      return name.startsWith(q) || q.startsWith(name);
    }) ??
    hits[0];

  if (!hit) return null;
  return {
    lat: hit.latitude,
    lng: hit.longitude,
    label: [hit.name_1, hit.outcode].filter(Boolean).join(", "),
  };
}
```

Exact name first, then prefix either way, then the top API hit. Asking for 5 and
re-ranking locally is better than trusting the provider's ordering, since
`Kilburn` and `Kilburn West` should not resolve to the same point.

Final fallback, UK-restricted. `client/lib/location-search.ts:347-375`

```ts
async function lookupNominatim(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "gb",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: "application/json", "Accept-Language": "en-GB" } },
  );
  if (!res.ok) return null;
  const results = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const hit = results[0];
  if (!hit) return null;
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    label: hit.display_name.split(",").slice(0, 2).join(",").trim(),
  };
}
```

`countrycodes=gb` stops an identically named place abroad from winning. Label is
trimmed to the first two comma segments so the result line stays readable.

### 7.8 Haversine distance

`client/lib/location-search.ts:377-390`

```ts
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

The great-circle formula on a sphere of radius 3958.8 miles. `a` is the squared
half-chord, and `2 * atan2(sqrt(a), sqrt(1-a))` is the central angle.
`atan2` rather than `arcsin` because it stays numerically stable when the two
points are very close, where `a` approaches 0 and `1 - a` rounds to 1.

At London scale the error against a proper ellipsoid is well under half a
percent, which is far below the precision anyone acts on.

### 7.9 Nearest branch, two-tier

This is where Coming Soon branches lose to open ones regardless of distance.
`client/lib/location-search.ts:392-424`

```ts
export function findNearestBranchWithinRadius(
  branches: SearchBranch[],
  lat: number,
  lng: number,
  radiusMiles = SEARCH_RADIUS_MILES,
) {
  let best: SearchBranch | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestComingSoon: SearchBranch | null = null;
  let bestComingSoonDistance = Number.POSITIVE_INFINITY;

  for (const branch of branches) {
    const distance = haversineMiles(lat, lng, branch.lat, branch.lng);
    if (distance > radiusMiles) continue;
    if (branch.comingSoon) {
      if (distance < bestComingSoonDistance) {
        bestComingSoon = branch;
        bestComingSoonDistance = distance;
      }
    } else if (distance < bestDistance) {
      best = branch;
      bestDistance = distance;
    }
  }

  // A branch that is not open yet only wins when no open branch is in range.
  if (!best) {
    return bestComingSoon
      ? { branch: bestComingSoon, distanceMiles: bestComingSoonDistance }
      : null;
  }
  return { branch: best, distanceMiles: bestDistance };
}
```

Single pass, O(n), two running minimums. A Coming Soon branch 0.2 miles away
loses to an open branch 12 miles away, as long as both are inside the 50 mile
radius. That is intentional: the customer cannot order from the near one.

`comingSoon` comes from the derived card status.
`client/app/components/store/locations-page.tsx:372-383`

```tsx
const result = await resolveNearestBranch(
  query,
  locations.flatMap((location) =>
    location.lat != null && location.lng != null
      ? [
          {
            ...location,
            lat: location.lat,
            lng: location.lng,
            comingSoon: location.status === "coming_soon",
          },
        ]
      : [],
  ),
);
```

Branches without coordinates are dropped before the call, so they are not
distance-searchable. They are also invisible to name search, because the whole
array is filtered first.

### 7.10 Local district lookup

`client/lib/location-search.ts:439-470`

```ts
function resultFromLocalOutcode(
  branches: SearchBranch[],
  parsed: ParsedPostcode,
  radiusMiles: number,
): Exclude<NearestBranchResult, { error: string }> | null {
  const hit = outcodeIndex[parsed.outcode];
  if (!hit) return null;
  // The index stores the outcode centre, so the nearest branch is resolved from
  // the live list. That keeps open branches ahead of coming soon ones.
  const nearest = findNearestBranchWithinRadius(branches, hit.lat, hit.lng, radiusMiles);
  if (nearest) {
    return {
      branch: nearest.branch,
      distanceMiles: nearest.distanceMiles,
      searchedLabel: parsed.formatted,
      via: "postcode",
    };
  }
  const branch = branchById(branches, hit.branchId);
  if (!branch) return null;
  return {
    branch,
    distanceMiles: hit.miles,
    searchedLabel: parsed.formatted,
    via: "postcode",
  };
}
```

The index is used only as a coordinate source. The branch itself is re-resolved
from the live list by distance, so the Coming Soon rule still applies. The
stored `branchId` is a fallback for when nothing is inside the radius.

`distanceMiles` is measured from the district centre, not from the customer's
actual position, since a district-only query has no better coordinate. The
number shown is therefore a district average, not a personal distance.

### 7.11 Result shaping

`client/lib/location-search.ts:498-506`

```ts
export type NearestBranchResult =
  | {
      branch: SearchBranch;
      distanceMiles: number | null;
      searchedLabel: string;
      via: "geo" | "name" | "suggest" | "postcode";
      matchKind?: BranchMatchKind;
    }
  | { error: string };
```

`distanceMiles` is `null` for a pure name match, since there is no origin point.
`via` selects the message wording.

`client/lib/location-search.ts:426-437`

```ts
function resultFromTextMatch(
  match: BranchTextMatch,
  searchedLabel: string,
): Exclude<NearestBranchResult, { error: string }> {
  return {
    branch: match.branch,
    distanceMiles: null,
    searchedLabel,
    via: match.kind === "exact" || match.kind === "strong" ? "name" : "suggest",
    matchKind: match.kind,
  };
}
```

exact or strong reads as "you asked, that is it". partial and fuzzy read as
"did you mean".

### 7.12 The UI caller

Submit-only. No debounce, no incremental filtering as the user types.
`client/app/components/store/locations-page.tsx:360-416`

```tsx
const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const query = search.trim();
  if (!query) {
    setSearchMessage({ type: "error", text: t("locations.searchRequired") });
    return;
  }

  setSearching(true);
  try {
    const result = await resolveNearestBranch(query, locations.flatMap(/* ... */));
    if ("error" in result) {
      setSearchMessage({ type: "error", text: result.error });
      return;
    }

    const distanceText =
      result.distanceMiles != null
        ? t("locations.milesAway", { miles: result.distanceMiles.toFixed(1) })
        : "";

    // A branch that is not open yet is still a match, so say so instead of
    // letting it read like a branch you can order from today.
    const comingSoonNote = result.branch.comingSoon ? ` · ${t("locations.comingSoon")}` : "";

    const prefix =
      result.via === "suggest"
        ? t("locations.suggest")
        : result.via === "name"
          ? t("locations.match")
          : t("locations.nearestTo", { label: result.searchedLabel });

    setSearchMessage({
      type: "success",
      text: `${localizedText(locale, result.branch.name)} — ${localizedText(locale, result.branch.address)}${distanceText}${comingSoonNote}`,
      branchId: result.branch.id,
      prefix,
    });
    revealBranch(result.branch.id);
  } finally {
    setSearching(false);
  }
};
```

Distance is rounded to one decimal place for display. A Coming Soon match gets
an explicit note appended, so it never reads as orderable. `finally` resets the
spinner even when a network geocode throws.

---

## 8. Branch selection

Choosing a branch writes a cookie and reloads branch-scoped data. A branch
switch with items in the cart is gated behind a confirm dialog.

`client/lib/branch-selection.tsx:54-68`

```ts
const commit = async (locationId: string, replaceCart: boolean) => {
  await api.patch("/store/location", { location_id: locationId });
  if (replaceCart) dispatch(switchCartBranch(locationId));
  dispatch(fetchFullMenu(locationId));
  dispatch(fetchDeals(locationId));
};

const selectBranch = (locationId: string, locationName: string) => {
  if (needsBranchSwitch(cart, locationId)) {
    setPending({ id: locationId, name: locationName });
    return false;
  }
  void commit(locationId, cart.items.length === 0 || cart.locationId === null);
  return true;
};
```

The gate. `client/lib/cart-model.ts:60-62`

```ts
export function needsBranchSwitch(state: CartState, nextLocationId: string): boolean {
  return state.items.length > 0 && state.locationId !== nextLocationId;
}
```

Only fires when the cart has items and the target is a different branch. An
empty cart switches silently. The same rule protects the add-to-cart reducer,
`client/lib/cart-model.ts:69`:

```ts
if (state.items.length > 0 && state.locationId !== locationId) return state;
```

Returning state unchanged drops the add rather than mixing branches in one cart.

`replaceCart` is true when the cart is empty or has no branch yet, so switching
from an unassigned cart clears any stale branch id.

### The cookie

`server/src/controllers/store/store.controller.ts:49-54`

```ts
async setLocation(req: Request, res: Response) {
  const location = await getLocationById(req.body.location_id);
  if (location.status !== "active") throw new NotFoundException("Location not found");
  res.cookie("crispy_location_id", location.id, COOKIE_OPTIONS);
  sendSuccess(res, location);
}
```

An inactive branch cannot be selected, even by direct API call.

Reading it back, `server/src/controllers/store/store.controller.ts:31-47`

```ts
async myLocation(req: Request, res: Response) {
  const id = req.cookies?.crispy_location_id;
  if (!id) {
    sendSuccess(res, null);
    return;
  }
  try {
    const location = await getLocationById(id);
    if (location.status !== "active") {
      sendSuccess(res, null);
      return;
    }
    sendSuccess(res, location);
  } catch {
    sendSuccess(res, null);
  }
}
```

Every failure path returns `null` rather than an error, since a stale or
deleted cookie is normal and should not surface to the customer.

### Scroll to the result

Manual scroll maths inside a scroll container.
`client/app/components/store/locations-page.tsx:326-343`

```tsx
const scrollListToBranch = (id: string) => {
  const idx = locations.findIndex((l) => l.id === id);
  const sc = scrollRef.current;
  const el = itemRefs.current[idx];
  if (!sc || !el) return;
  const next =
    sc.scrollTop +
    el.getBoundingClientRect().top -
    sc.getBoundingClientRect().top -
    8;
  sc.scrollTo({ top: Math.max(0, next), behavior: "smooth" });
};

const scrollPageToMap = () => {
  const section = mapSectionRef.current;
  if (!section) return;
  lenis.scrollTo(section, { offset: navbarOffset() });
};
```

`scrollTop` plus the delta between the item and container rects gives the target
offset without `scrollIntoView`, which would also scroll the page and fight
Lenis. Clamped at 0 so a partially visible first row cannot scroll negative.

```tsx
const revealBranch = (id: string) => {
  chooseBranch(id);
  window.setTimeout(() => {
    scrollListToBranch(id);
    scrollPageToMap();
  }, 80);
};
```

The 80ms delay lets React commit the DOM before measuring. Lenis handles the
page-level scroll, the native API handles the list.

---

## 9. Map viewport

Leaflet, created imperatively. Lazy loaded so it never runs on the server.

`client/app/components/store/client-locations-map.tsx:12-34`

```ts
export default function ClientLocationsMap(props: MapProps) {
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);

  useEffect(() => {
    let active = true;
    void import("./locations-map").then((mod) => {
      if (active) setMapView(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!MapView) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
        Loading map…
      </div>
    );
  }

  return <MapView {...props} />;
}
```

`active` guards against setting state after unmount, so a slow chunk load on a
fast navigation cannot warn.

### Guarded init

Leaflet throws if a container already holds an instance, which StrictMode
remounts and HMR both cause. The node is scrubbed first.
`client/app/components/store/locations-map.tsx:104-127`

```ts
const el = hostRef.current;
if (!el) return;

// Destroy any instance a previous mount left on this DOM node — without
// this, L.map() throws "Map container is being reused by another instance".
const stale = el.__crispyMap;
if (stale) {
  try {
    stale.remove();
  } catch {
    /* already torn down */
  }
  el.__crispyMap = undefined;
}
delete el._leaflet_id;

const map = L.map(el, {
  center: initialCenterRef.current,
  zoom: 13,
  scrollWheelZoom: false,
  attributionControl: false,
});
```

The instance is parked on the DOM node itself, which is the only place that
survives a React remount, and `_leaflet_id`, Leaflet's own private marker, is
deleted. `scrollWheelZoom: false` stops the map hijacking page scroll.

### Sizing race

A map initialised into a container that has not been laid out renders grey.
`client/app/components/store/locations-map.tsx:135-144`

```ts
let cancelled = false;
map.whenReady(() => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (!cancelled && isMapAlive(map)) map.invalidateSize();
    }, 50);
  });
});

setMapEpoch((e) => e + 1);
```

Wait for ready, then two animation frames plus 50ms, then `invalidateSize`. This
is why the map card needs an explicit height on mobile, see section 12.

`setMapEpoch` bumps a counter so the marker and fly-to effects re-run against
the new instance. On a StrictMode remount `mapRef` points at a brand-new object
but the effect deps are otherwise unchanged, so without the epoch they would
silently do nothing.

### Markers and initial bounds

`client/app/components/store/locations-map.tsx:170-208`

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isMapAlive(map)) return;

  markersRef.current.forEach((marker) => {
    try {
      marker.remove();
    } catch {
      /* ignore */
    }
  });
  markersRef.current.clear();

  locations.forEach((loc, i) => {
    const active = loc.id === selectedId;
    try {
      const marker = L.marker([loc.lat, loc.lng], {
        icon: pinIcon(i + 1, active),
        zIndexOffset: active ? 1000 : 0,
      }).addTo(map);
      marker.on("click", () => onSelect?.(loc.id));
      markersRef.current.set(loc.id, marker);
    } catch {
      /* map torn down mid-update */
    }
  });

  if (!didFitBoundsRef.current && locations.length > 1) {
    didFitBoundsRef.current = true;
    try {
      const bounds = L.latLngBounds(
        locations.map((loc) => [loc.lat, loc.lng] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    } catch {
      /* map torn down mid-update */
    }
  }
}, [mapEpoch, locations, selectedId, onSelect]);
```

Markers are fully torn down and rebuilt on every change rather than diffed. At
nine branches that is cheaper than the bookkeeping. The active pin gets
`zIndexOffset: 1000` so it draws above its neighbours.

`fitBounds` runs exactly once, guarded by `didFitBoundsRef`, because it fights
the fly-to effect. `maxZoom: 12` stops two nearby branches producing an
absurdly close view.

### Fly to selection, skipping the first run

`client/app/components/store/locations-map.tsx:211-237`

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isMapAlive(map) || !selected) return;

  if (skipFirstFlyRef.current) {
    skipFirstFlyRef.current = false;
    return;
  }

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    if (reduceMotion) {
      map.setView([selected.lat, selected.lng], 13, { animate: false });
    } else {
      map.flyTo([selected.lat, selected.lng], 13, {
        duration: 1.1,
        easeLinearity: 0.3,
      });
    }
  } catch {
    // Map torn down mid-call (React Strict Mode remount) — ignore.
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mapEpoch, selected?.lat, selected?.lng]);
```

The initial mount is skipped so the map does not animate on page load, where
`fitBounds` already framed everything. `prefers-reduced-motion` swaps the
animation for an instant jump. `easeLinearity: 0.3` accelerates out of the start
position, which feels responsive rather than floaty.

### Tile layer

`client/app/components/store/locations-map.tsx:23-25`

```ts
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_BASECMAPS_API_KEY ?? "";

const DARK_TILE_URL = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;
```

An empty key still loads tiles, they come back watermarked "API key required"
instead. The comment in the source says so.

The dark basemap has to fight Tailwind preflight, which sets
`img { max-width: 100%; height: auto }` globally and squashes tiles.
`client/app/components/store/leaflet-overrides.css:1-18`

```css
/*
 * Tailwind's Preflight sets `img { max-width: 100%; height: auto }`
 * globally, which breaks Leaflet's tile images - they need fixed,
 * unconstrained width/height to tile seamlessly into a map. Without
 * this override, tiles render squashed/misaligned or blank.
 */
.leaflet-container,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
  max-width: none !important;
  max-height: none !important;
}
```

---

## 10. Hours parsing, admin only

`client/lib/admin/shop-hours.ts` round-trips the free-text hours string into a
per-day structure for the admin form. It never evaluates against the clock and
never runs on the storefront.

Coming Soon marker. `client/lib/admin/shop-hours.ts:7-10`

```ts
/** "Coming Soon" in the hours text marks a branch that is listed but not open yet. */
export function isComingSoonHours(hours: string): boolean {
  return /coming soon/i.test(hours);
}
```

12-hour to 24-hour. `client/lib/admin/shop-hours.ts:12-30`

```ts
export function to24Hour(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  if (hour > 23) return null;
  return `${String(hour).padStart(2, 0)}:${minute}`;
}

export function to12Hour(value: string): string {
  const [hourPart, minute] = value.split(":");
  const hour = Number(hourPart);
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${period}`;
}
```

The two 12am and 12pm traps are both handled: 12am becomes 0, and `hour % 12 || 12`
turns a stored 0 back into 12 rather than 0.

Day range expansion, Monday-first.
`client/lib/admin/shop-hours.ts:32-41`

```ts
function blankWeek(open = "11:00", close = "23:00"): DayHours[] {
  return Array.from({ length: 7 }, () => ({ open, close }));
}

function rangeDays(start: number, end: number): number[] {
  const startAt = WEEK_ORDER.indexOf(start);
  const endAt = WEEK_ORDER.indexOf(end);
  if (startAt < 0 || endAt < startAt) return [start];
  return WEEK_ORDER.slice(startAt, endAt + 1);
}
```

`WEEK_ORDER` is `[1, 2, 3, 4, 5, 6, 0]`, Monday through Sunday, while the array
itself is indexed Sunday-first to match `Date.getDay()`. Translating through
`indexOf` is what makes `Mon–Sat` expand correctly without wrapping. An inverted
range such as `Sat–Mon` falls back to a single day rather than looping forever.

The parser, with a two-tier fallback.
`client/lib/admin/shop-hours.ts:43-67`

```ts
export function parseWeekHours(hours: string): DayHours[] {
  const week = blankWeek();
  if (isComingSoonHours(hours)) return Array.from({ length: 7 }, () => null);

  const chunks = [...hours.matchAll(/(?:Every day|(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[–-](Mon|Tue|Wed|Thu|Fri|Sat|Sun))?)\s*·\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi)];
  if (chunks.length === 0) {
    const times = [...hours.matchAll(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi)]
      .map((match) => to24Hour(match[1]))
      .filter((value): value is string => Boolean(value));
    if (times.length >= 2) return blankWeek(times[0], times[1]);
    return week;
  }

  const parsed = Array.from({ length: 7 }, () => null) as DayHours[];
  for (const chunk of chunks) {
    const open = to24Hour(chunk[3]);
    const close = to24Hour(chunk[4]);
    if (!open || !close) continue;
    const days = /^every day/i.test(chunk[0])
      ? [...WEEK_ORDER]
      : rangeDays(DAY_INDEX[chunk[1].toLowerCase()], chunk[2] ? DAY_INDEX[chunk[2].toLowerCase()] : DAY_INDEX[chunk[1].toLowerCase()]);
    for (const day of days) parsed[day] = { open, close };
  }
  return parsed;
}
```

Tier one matches labelled ranges such as `Mon–Sat · 9:00 AM – 11:00 PM`. Tier
two, used when that finds nothing, grabs the first two bare times anywhere in the
string and applies them to all seven days. That is what makes the bare
`11:00 AM – 11:00 PM` in the seed data parse into a full week.

Coming Soon returns seven nulls, so every day renders closed in the form.

The writer, which collapses consecutive equal days back into ranges.
`client/lib/admin/shop-hours.ts:69-96`

```ts
function sameHours(left: DayHours, right: DayHours) {
  if (!left || !right) return left === right;
  return left.open === right.open && left.close === right.close;
}

export function formatWeekHours(week: DayHours[]): string {
  const groups: { start: number; end: number; hours: DayHours }[] = [];
  for (const day of WEEK_ORDER) {
    const hours = week[day];
    const last = groups.at(-1);
    const nextToLast = last ? WEEK_ORDER.indexOf(day) === WEEK_ORDER.indexOf(last.end) + 1 : false;
    if (last && nextToLast && sameHours(last.hours, hours)) last.end = day;
    else groups.push({ start: day, end: day, hours });
  }

  const openGroups = groups.filter((group) => group.hours);
  if (openGroups.length === 1 && openGroups[0].start === 1 && openGroups[0].end === 0) {
    const hours = openGroups[0].hours;
    return hours ? `Every day · ${to12Hour(hours.open)} – ${to12Hour(hours.close)}` : "Closed";
  }

  return openGroups.map((group) => {
    const hours = group.hours;
    if (!hours) return "";
    const label = group.start === group.end ? DAY_LABELS[group.start] : `${DAY_LABELS[group.start]}–${DAY_LABELS[group.end]}`;
    return `${label} · ${to12Hour(hours.open)} – ${to12Hour(hours.close)}`;
  }).join(" · ");
}
```

Walking in Monday-first order and merging only when `indexOf(day)` is exactly
one past the previous end is what stops a merge wrapping from Sunday back to
Monday. A full week collapses to the single `Every day` form.

### Real data this parses

From the seed migration, `server/prisma/migrations/20260927140000_crispies_branches/migration.sql:12-20`:

| Name | Slug | Address | Postcode | Hours | Lat | Lng |
| --- | --- | --- | --- | --- | --- | --- |
| Harrow Road | `harrow-road` | 412 Harrow Road, London W9 2HU | W9 2HU | 11:00 AM – 11:00 PM | 51.523411 | -0.196294 |
| Tower Hill | `tower-hill` | Unit 2, Tower Hill Terrace, London EC3N 4EE | EC3N 4EE | 11:00 AM – 11:00 PM | 51.509201 | -0.078397 |
| Kilburn | `kilburn` | 302 Kilburn High Rd, Kilburn, London NW6 2DB | NW6 2DB | 9:00 AM – 11:00 PM | 51.544201 | -0.200361 |
| Harrow | `harrow` | 253 Station Rd, Harrow, London HA1 2TB | HA1 2TB | 9:00 AM – 11:00 PM | 51.583105 | -0.332066 |
| Elephant & Castle | `elephant-and-castle` | 345 Walworth Rd, Elephant & Castle, London SE17 2NA | SE17 2NA | 9:00 AM – 11:00 PM | 51.48606 | -0.094754 |
| Edgware Road | `edgware-road` | 340 Edgware Rd, Westminster, London W2 1EA | W2 1EA | 11:00 AM – 11:00 PM | 51.52107 | -0.171146 |
| Stockwell | `stockwell` | 314 Clapham Rd, Lambeth, London SW9 9AE | SW9 9AE | 9:00 AM – 11:00 PM | 51.470752 | -0.124765 |
| Wembley Central | `wembley-central` | 421 High Rd, Wembley, London HA9 7AB | HA9 7AB | Coming Soon | 51.553282 | -0.29421 |
| Ruislip | `ruislip` | 77 Victoria Road, Ruislip, London HA4 9BH | HA4 9BH | Coming Soon | 51.571683 | -0.411649 |

Ids are UUIDs, for example `6f8c2a14-0b31-4d5e-9a72-11c0ffee0001` for Harrow
Road. All nine have `status = active`; the two Coming Soon branches are marked
closed purely by their hours text.

---

## 11. Address and hours translation

Arabic is a whole-page flip, so addresses and hours are translated by string
substitution at render time rather than being stored translated.

`client/lib/i18n/index.ts:135-155`

```ts
/** Translates a stored English phrase, including hours and addresses, when Arabic is selected. */
export function localizedText(locale: unknown, value?: string | null): string {
  if (!value) return "";
  if (resolveLocale(locale) !== "ar") return value;
  if (PHRASES[value]) return PHRASES[value];
  const translated = value
    .replace(/Coming Soon/g, PHRASES["Coming Soon"])
    .replace(/Elephant & Castle/g, PHRASES["Elephant & Castle"])
    .replace(/Harrow Road/g, PHRASES["Harrow Road"])
    .replace(/Edgware Road/g, PHRASES["Edgware Road"])
    .replace(/Wembley Central/g, PHRASES["Wembley Central"])
    .replace(/Tower Hill/g, PHRASES["Tower Hill"])
    .replace(/\bLondon\b/g, PHRASES.London)
    .replace(/\bKilburn\b/g, PHRASES.Kilburn)
    .replace(/\bHarrow\b/g, PHRASES.Harrow)
    .replace(/\bStockwell\b/g, PHRASES.Stockwell)
    .replace(/\bRuislip\b/g, PHRASES.Ruislip)
    .replace(/ AM/g, " ص")
    .replace(/ PM/g, " م");
  return PHRASES[translated] ?? translated;
}
```

Order matters. An exact `PHRASES[value]` hit short-circuits, so `Harrow Road`
resolves as one unit. Otherwise `Harrow Road` is replaced before the bare
`Harrow` rule, so the compound name is not left half translated. `\b` on the
bare place names keeps `Harrow` from firing inside `Harrow Road`.

The `AM` and `PM` rules are what translate the hours without touching the digits,
which is why `9:00 AM – 11:00 PM` becomes Arabic meridiem markers in place.

The final `PHRASES[translated]` is a second pass, catching a string that only
became a known phrase after substitution.

There is no Arabic column on `locations`. The DB holds English only.

---

## 12. Responsive row grid

Six columns on desktop, four on mobile. The mobile case needs its own template
because the desktop `clamp()` minimums sum to more than a phone is wide.

Desktop, 640px and up. `client/app/globals.css:529-545`

```css
@media (min-width: 640px) {
  .loc-row-grid {
    grid-template-columns:
      clamp(28px, 3vw, 40px)        /* number */
      clamp(140px, 16vw, 220px)     /* name */
      minmax(0, 1fr)                /* address */
      clamp(100px, 11vw, 140px)     /* status pill */
      minmax(70px, 8vw)             /* hours */
      38px;                         /* arrow */
    column-gap: clamp(8px, 1.2vw, 16px);
  }

  .loc-row-hours {
    white-space: nowrap;
    overflow-wrap: normal;
  }
}
```

At the 640px floor the fixed minimums total 28 + 140 + 100 + 70 + 38 = 376px plus
gaps, leaving roughly 180px for the address. Comfortable at desktop widths where
`1fr` absorbs the surplus.

Mobile, below 640px. `client/app/globals.css:497-527`

```css
@media (max-width: 639px) {
  .loc-row-grid {
    grid-template-columns:
      24px
      minmax(0, 1fr)
      minmax(0, 1.2fr)
      38px;
    column-gap: 8px;
  }

  /* Keep status and hours from fighting for horizontal space */
  .loc-row-grid > span:nth-child(4),
  .loc-row-hours {
    grid-column: 2 / 4;
  }

  .loc-row-grid > span:nth-child(4) {
    justify-self: start;
  }

  .loc-row-hours {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .loc-row-grid > button {
    grid-column: 4;
    grid-row: 1 / span 4;
    align-self: center;
  }
}
```

The arrow spans all four rows on the right, so the row reads as one block with
the pin on the side. Status and hours both start at column 2 and run to column
4, which stacks them onto their own full-width row instead of squeezing them
into the narrow gap beside the address. `overflow-wrap: anywhere` lets hours
break mid-token, which is what keeps `11:00 AM – 11:00 PM` inside its track
rather than running under the arrow.

`min-width: 0` on every child is what makes this work at all.
`client/app/globals.css:472-480`

```css
.loc-row-grid > * {
  min-width: 0;
}

.loc-row-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Grid items default to `min-width: auto`, which refuses to shrink below the
content. Without the reset, a long branch name sets its own floor and pushes the
`1fr` address track to zero, which is what caused hours to overlap the arrow.
`text-overflow: ellipsis` is what truncates the name once it is allowed to shrink.

### Map height on mobile

The map card needs an explicit height below `lg`.
`client/app/components/store/locations.tsx:394-399`

```tsx
{/* Right — real map card. Needs an explicit height below lg: the
    parent stacks with flex-col there, so h-full resolves against an
    auto-height parent and collapses to zero. Everything inside the
    map is absolutely positioned, so nothing else gives it size. */}
<div
  className="fade-up h-[320px] w-full lg:h-full lg:w-[420px] xl:w-[40%] shrink-0"
  data-delay="0.1"
>
```

`h-full` means `height: 100%`, which needs a parent with a definite height. In
the mobile `flex-col` stack the parent is auto-height, so `h-full` computes to
`auto`, and every child inside is `absolute inset-0`, so nothing contributes
height and the card collapses. At `lg` the row is `items-stretch`, the parent has
a definite height from the list beside it, and `h-full` works.

Combined with the `invalidateSize` delay in section 9, this is why the map must
have a real height before Leaflet can paint tiles into it.

---

## 13. Admin filtering

There is no text search on the admin locations page. Every branch is rendered.

`client/app/super-admin/locations/page.tsx:84-85`

```tsx
) : loading ? <TableSkeleton /> : locations.length === 0 ? (
  <p className="rounded-2xl border border-white/10 px-5 py-10 text-center text-sm text-white/50">No branches yet. Add one to set its address and hours.</p>
```

Scope comes from the API, not from a filter control.
`server/src/controllers/admin/locations.controller.ts:17-28`

```ts
async list(req: Request, res: Response) {
  const allowed = await getAccessibleLocationIds(req.admin!);
  // Two independent reads, so they overlap instead of queueing. The branch
  // filter moved into the locations query, which previously fetched every
  // branch row and trimmed the list in JavaScript.
  const [locations, counts] = await Promise.all([
    getLocations({ allowedIds: allowed }),
    countStaffByLocation(),
  ]);
  sendSuccess(res, locations.map((location) => ({ ...location, staff_count: counts.get(location.id) ?? 0 })));
}
```

`null` means superadmin, every branch. `server/src/services/branch-access.service.ts:11-25`

```ts
export function accessibleLocationIds(role: string, assignedLocationIds: string[]): string[] | null {
  if (normalizeRole(role) === "superadmin") return null;
  return assignedLocationIds;
}

export async function getAccessibleLocationIds(admin: Pick<AuthPayload, "sub" | "role">): Promise<string[] | null> {
  const role = normalizeRole(admin.role);
  if (role === "superadmin") return null;

  const rows = await getPrisma().admin_branch_access.findMany({
    where: { admin_id: admin.sub },
    select: { location_id: true },
  });
  return accessibleLocationIds(admin.role, rows.map((row) => row.location_id));
}
```

The two reads are independent so they overlap rather than queue. The scope is
pushed into the SQL `id IN (...)` instead of trimming in JavaScript.

The reusable multi-select does substring search, label only.
`client/app/components/admin/ui/multi-select.tsx:30`

```tsx
{options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())).map((option) => (
```

Plain case-insensitive `includes` against `locations.name`. No address, no
postcode, no typo tolerance.

### The one server-side branch name search

Job posts, not branches. `server/src/services/admin.service.ts:223-242`

```ts
function jobPostWhere(filter?: { status?: string; q?: string } & JobPostBranchScope) {
  const q = filter?.q?.trim();
  const branch = jobPostBranchWhere(filter);
  return {
    ...(filter?.status ? { status: filter.status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
            // The stored `location` is a write-time snapshot, so a renamed branch
            // would stop matching its own name. The relation is searched too.
            { location: { contains: q, mode: "insensitive" as const } },
            { location_ref: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(branch.length > 0 ? { AND: branch } : {}),
  };
}
```

Case-insensitive substring, compiling to `ILIKE '%q%'`, across four columns. The
fourth is the live relation, because the third is a denormalised snapshot taken
when the job was created and goes stale on a branch rename.

---

## 14. Known gaps

| Gap | Where | Effect |
| --- | --- | --- |
| Coverage index keyed by slug, live branches by UUID | `location-coverage.json` vs `admin.service.ts:88` | `exactPostcodes[...].branchId` and the `resultFromLocalOutcode` fallback never resolve, because `branchById` compares `branch.id`. The working paths use lat/lng from the index instead, so the effect is limited to the last-resort fallbacks. |
| Outcode branch returns an error object unguarded | `location-search.ts:588` | `if (geo) return geo;` where the place and nominatim paths both guard with `!("error" in geo)`. An outcode geocode with no branch in range returns the error instead of falling through. |
| Missing coordinates make a branch unfindable | `locations-page.tsx:372-383` | Branches are filtered out before matching, so a branch with no lat/lng cannot be found by name either. |
| `SearchBranch.postcode` unused | `location-search.ts:11` | Declared but never read. The card postcode is display-only. |
| `locations.postcode` column unused on the storefront | `storefront-locations.ts:50` | The card postcode is regexed from the address instead of read from the column. |
| No tests for the search engine | none | `location-search.ts` and `generate-location-coverage.mjs` have no test file. |
| No clock-based open/closed | whole repo | `getHours`, `getDay`, `getMinutes` appear nowhere. The status pill reflects listing state, not trading state. |
| Docs claim active-only | `docs/backend.md:203` | The storefront passes no `activeOnly`, so inactive branches are returned and shown as Closed. |
