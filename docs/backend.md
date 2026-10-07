# Crispies — Backend

The Express API behind the storefront and the admin: stack, conventions, and every endpoint.

System design is in [Architecture](./architecture.md). The longer project guide, including frontend design, is in [Project guide](./README.md).

---

## Stack and commands

Node (ESM), Express 4, TypeScript (strict), Prisma 7 with `@prisma/adapter-pg`, Zod, Pino, Helmet, CORS, compression, cookie-parser, express-rate-limit, multer, Cloudinary, Resend, jsonwebtoken.

```
pnpm dev              nodemon + tsx
pnpm build            tsc, then scripts/fix-dist-imports.mjs
pnpm start            node dist/index.js
pnpm lint | typecheck
pnpm test             tsx --test tests/**/*.test.ts (hits the configured database)
pnpm migrate          prisma migrate deploy
pnpm prisma:generate
pnpm seed             empty-database seed: settings, nine branches, branch lines
pnpm seed:catalogue   development catalogue (upsert, never deletes, refused when NODE_ENV=production)
pnpm db:ping          Neon connectivity check
```

Never run `prisma db push` or `prisma migrate reset` against the live database. Schema changes go through a new migration folder in `server/prisma/migrations/` and `pnpm migrate`.

Environment variables are listed in [Architecture](./architecture.md#apps-ports-and-environment). The required ones are `NEON_DATABASE_URL`, `JWT_SECRET`, the Resend trio, and the Cloudinary trio.

---

## Request pipeline (`src/index.ts`)

```
helmet
  → cors (credentials on)
  → compression
  → cookieParser
  → identifyCustomer        sets crispy_customer_id if missing
  → json (10 MB) / urlencoded
  → pino HTTP log
  → GET /health             before the limiters
  → global limiter          skipped for /api/admin
  → auth limiter            /api/admin/auth, 10 failures / 15 min
  → admin limiter           /api/admin
  → /api routes
  → errorHandler
```

`trust proxy` is 1 so the client IP behind the Next rewrite is correct.

Health is not under `/api`: `GET /health` → `{ "status": "ok", "timestamp": "<ISO>" }`.

---

## Layers

```
routes/        validate(zodSchema) + asyncHandler. No logic, no try/catch.
controllers/   plain objects with async methods. sendSuccess().
services/      Prisma queries, pricing, emails, uploads. Throw named exceptions.
middleware/    auth, identify-customer, validate, rate limit, logger, error handler
validators/    Zod schemas
config/        env, prisma, cloudinary, http status, locales
utils/         app-error, async-handler, response, db serialize, password, slug
generated/     Prisma client (do not edit)
```

Named exceptions in `utils/app-error.ts`: `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `ItemUnavailableException` (400, carries the offending cart line), `InternalServerException` (500).

---

## Conventions

### Envelopes

Success:

```json
{ "success": true, "data": {} }
```

Application error:

```json
{ "success": false, "error": "Human-readable message", "code": "ERR_NOT_FOUND" }
```

Zod validation failure (HTTP 400). There is no `code` field:

```json
{ "success": false, "error": "Validation failed", "errors": { "email": ["Invalid email"] } }
```

Unavailable cart line (HTTP 400) also names the line:

```json
{ "success": false, "error": "...", "code": "ERR_ITEM_UNAVAILABLE", "item": { "kind": "product", "id": "mock-burger-spicy" } }
```

| Code | Status | Meaning |
|---|---|---|
| `ERR_BAD_REQUEST` | 400 | Bad input, illegal status transition, unsupported locale |
| `ERR_ITEM_UNAVAILABLE` | 400 | Product or deal not sold or not available at that branch |
| `ERR_UNAUTHORIZED` | 401 | Missing or bad token, bad credentials, inactive staff |
| `ERR_FORBIDDEN` | 403 | Role or branch access denied |
| `ERR_NOT_FOUND` | 404 | Row missing, inactive branch, or an order that is not yours |
| `ERR_CONFLICT` | 409 | Another status update landed first |
| `ERR_TOO_MANY` | 429 | Rate limit |
| `ERR_LIMIT_FILE_SIZE` | 413 | Upload too large (other multer errors are `ERR_<multer code>`, 400) |
| `ERR_INTERNAL` | 500 | Unexpected failure |

Money in responses is a JSON number in GBP. Ids of orders and order lines are numeric; everything else is a string.

### Rate limits

Window is 15 minutes. `RATE_LIMIT_MAX` defaults to 100.

| Limiter | Applies to | Max |
|---|---|---|
| Global | Everything except `/api/admin` and `/health` | `RATE_LIMIT_MAX` |
| Auth | `/api/admin/auth` | 10 failed requests (successes not counted) |
| Admin | `/api/admin` | `RATE_LIMIT_MAX` |

### Cookies

| Cookie | Set by | Lifetime | Use |
|---|---|---|---|
| `crispy_admin_session` | `POST /api/admin/auth/login` | `JWT_EXPIRES_IN` (default 7d) | HttpOnly staff session |
| `crispy_customer_id` | Every request that arrives without it | 1 year | Guest identity. Copied onto orders |
| `crispy_location_id` | `PATCH /api/store/location` | 90 days | Selected branch for menu and deals |
| `crispy_locale` | Storefront language switcher | — | `en` or `ur` for homepage copy |

Server cookies are `httpOnly`, `sameSite=lax`, path `/`, `secure` in production.

### Branch scope for staff

`superadmin` sees every branch. `branch_manager` and `staff` see only branches in `admin_branch_access`. Where a route is branch-scoped, another branch returns 403, and list routes return only assigned branches.

---

## Public — Menu

### `GET /api/menu/full`

Categories ordered by `sort_order`, each with nested items.

| Branch source | Result |
|---|---|
| None | Global catalogue: active items at `menu_items.price` |
| `?location_id=<id>` | That branch only. Unknown or inactive id → 404 |
| `crispy_location_id` cookie (no query) | That branch. A stale cookie falls back to the global menu |

For a branch, an item appears only when it is active and has an available `branch_menu_items` row. `price` is the branch override when set, otherwise the global price. Categories with no remaining items are omitted.

### `GET /api/menu/categories`

Flat global category list.

### `GET /api/menu/items`

Active global items. Optional `?category_id=`.

### `GET /api/menu/deals`

Active deals. Same branch rules as `/menu/full` (query, then cookie, then global).

### `POST /api/menu/quote`

Server price for a cart. The client price is never read; extra fields such as `price` and `name` are stripped. The cookie is not read; `locationId` is required.

```json
{
  "locationId": "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001",
  "items": [
    { "kind": "product", "id": "mock-burger-crispy", "quantity": 2 },
    { "kind": "deal", "id": "mock-deal-wings", "quantity": 1 }
  ]
}
```

`kind`: `product` | `deal`. `quantity`: integer 1–99. 1–40 lines.

```json
{
  "locationId": "...",
  "items": [
    { "kind": "product", "id": "mock-burger-crispy", "name": "Crispy Chicken Burger", "quantity": 2, "unitPrice": 9.25, "lineTotal": 18.5 }
  ],
  "subtotal": 18.5,
  "total": 18.5
}
```

Missing or inactive branch → 404. A line that is inactive, missing a branch row, or unavailable → `ERR_ITEM_UNAVAILABLE` with `item`. Delivery fees are not added; `total` equals `subtotal`.

---

## Public — Store

### `GET /api/store/locations`

Active branches only. A branch with `hours: "Coming Soon"` is included: that text marks a branch that is listed but not open yet, and the storefront shows it with a `Coming Soon` badge.

### `GET /api/store/locations/:id`

One location. 404 if missing.

### `GET /api/store/location`

The branch in `crispy_location_id`, or `null` if the cookie is missing, stale, or points at an inactive branch.

### `PATCH /api/store/location`

```json
{ "location_id": "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001" }
```

Sets the cookie and returns the location. 404 if the branch is missing or inactive.

### `GET /api/store/settings`

```json
{ "id": 1, "delivery_fee": 2.99, "free_delivery_threshold": 20, "updated_at": "..." }
```

### `GET /api/store/cms/:page`

Published content for one CMS page (`site`, `home`, …). Unknown page → 404. Locale: `?locale=`, then `crispy_locale`, then `Accept-Language`, then `en`. `GET /api/store/homepage` is an alias for `/api/store/cms/home`.

Inactive sections are left out of `order` and `sections`. Every other section is present with every field: published copy in the requested locale, else published English, laid over the registry defaults.

`GET /api/store/cms/site` returns `sections.ordering`: `{ "mode": "cart" | "redirect", "redirectUrl": "", "ctaLabel": "Order Now" }`. `mode = "redirect"` tells the storefront to send order buttons to `redirectUrl` (always `https://`).

### `GET /api/store/jobs`

Job posts with `status: "active"`. Optional `?location_id=` narrows to one branch. Feeds the storefront `/career` page.

### `GET /api/store/jobs/:id`

One active job. 404 if missing or not active. Feeds `/career/:id`.

---

## Public — Orders and customers

### `POST /api/orders`

Checkout. The server re-prices every line exactly like `/menu/quote`, then writes the order and its lines in one transaction. Client prices and totals are ignored. `customer_id` comes from the cookie, never the body. Status is always `pending`.

```json
{
  "customer_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "07123456789",
  "fulfilment": "delivery",
  "payment_method": "card",
  "location_id": "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001",
  "checkout_key": "6d1f7a0e-3b1c-4a8e-9f2d-2b5e8c9a1f00",
  "address": "123 High Street",
  "postcode": "W9 2HU",
  "city": "London",
  "notes": "Ring the bell",
  "items": [{ "kind": "product", "id": "mock-burger-crispy", "quantity": 2 }]
}
```

| Field | Rule |
|---|---|
| `customer_name` | 1–200 chars |
| `email` | Valid email |
| `phone` | 7–20 chars |
| `fulfilment` | `delivery` or `collection` |
| `payment_method` | `card` or `cash`. A label only, nothing is charged |
| `location_id` | Required. Must be an active branch |
| `checkout_key` | UUID. Unique per order; repeating it returns the original order instead of creating another |
| `address`, `postcode`, `city` | Required for `delivery`. Nullable otherwise |
| `notes` | Optional, up to 1000 chars |
| `items` | 1–40 lines of `{ kind, id, quantity }`, quantity 1–99 |

`201` returns the order with an `items` array of snapshots (`kind`, `name`, `price`, `quantity`, `menu_item_id` or `deal_id`). `delivery_fee` is 0 and `total` equals the subtotal. An unavailable line returns `ERR_ITEM_UNAVAILABLE` and nothing is created. The first order from a cookie creates the `customers` row. Confirmation emails are attempted after commit and never roll the order back.

### `GET /api/orders/mine`

Orders for the current `crispy_customer_id`, newest first. Empty array if none.

### `POST /api/orders/lookup`

```json
{ "email": "jane@example.com" }
```

Orders with that email **that also belong to this cookie**. It does not reveal other browsers' orders.

### `GET /api/orders/:id`

`{ "order": {}, "items": [] }`. Returned only when the order's `customer_id` equals the caller's cookie. Otherwise 404.

### `GET /api/customers/me` and `PATCH /api/customers/me`

The guest profile for this cookie (`id`, `name`, `email`, `phone`), or an empty profile if none exists yet. PATCH takes any of `name`, `email`, `phone` (at least one). A `customer_id` field is stripped. Writes only the caller's own row.

### `POST /api/contact`

```json
{ "name": "Jane Doe", "email": "jane@example.com", "subject": "Franchise", "message": "I want to open a store.", "type": "franchise" }
```

`type`: `general` | `franchise` | `careers` | `press`. `201` returns the stored message.

### `POST /api/jobs/:id/apply`

The job id is the URL param. Increments `job_posts.applications`.

```json
{ "applicant_name": "Jane Doe", "email": "jane@example.com", "phone": "+44 7123 456789", "cv_url": "https://...", "cover_letter": "..." }
```

`phone`, `cv_url`, `cover_letter` optional. `201` returns the application.

---

## Admin — Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/auth/login` | `{ email, password }`. Sets the HttpOnly `crispy_admin_session` cookie and returns the profile. Unknown email, wrong password, and inactive account all return the same 401 |
| POST | `/api/admin/auth/refresh` | Needs a still-valid cookie for an active account. Rotates the cookie and returns the profile |
| GET | `/api/admin/auth/me` | Current staff profile |
| PATCH | `/api/admin/auth/me` | `{ "name": "New Name" }`. Any role may change their own name. Role cannot be changed here |

`password_hash` is never returned.

---

## Admin — Upload

| Method | Path | Max size | Types |
|---|---|---|---|
| POST | `/api/admin/upload` | 5 MB | JPEG, PNG, WebP, AVIF, MP4, WebM, QuickTime |
| POST | `/api/admin/upload-media` | 50 MB | Same |

`multipart/form-data`, field name `file`. Files are stored in Cloudinary; nothing binary goes into Postgres. `201`: `{ "url": "https://res.cloudinary.com/...", "publicId": "..." }`. No file or a rejected type → 400. Too large → 413.

---

## Admin — Catalogue

Global brand catalogue. Any authenticated staff role. Ids are generated by the server.

### Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/categories` | List |
| GET | `/api/admin/categories/:id` | 404 if missing |
| POST | `/api/admin/categories` | `number` (≤4 chars), `title`, `image` (URL), optional `sort_order` |
| PUT | `/api/admin/categories/:id` | Partial |
| DELETE | `/api/admin/categories/:id` | Cascades to its items |

### Menu items

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/menu` | Includes inactive. `?category_id=` |
| GET | `/api/admin/menu/:id` | |
| POST | `/api/admin/menu` | `category_id`, `name`, `description`, `price`, `image`, optional `badge`, `badge_variant` (`default` \| `vegan` \| null), `sort_order`, `active` |
| PUT | `/api/admin/menu/:id` | Partial |
| DELETE | `/api/admin/menu/:id` | Order lines keep their snapshot; `menu_item_id` becomes null. Branch lines are removed |

### Deals

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/deals` | Includes inactive |
| GET | `/api/admin/deals/:id` | |
| POST | `/api/admin/deals` | `name`, `description`, `price`, `image`, optional `badge`, `badge_variant`, `active` |
| PUT | `/api/admin/deals/:id` | Partial |
| PATCH | `/api/admin/deals/:id/toggle` | Flips `active` |
| DELETE | `/api/admin/deals/:id` | Order lines keep their snapshot; `deal_id` becomes null |

---

## Admin — Locations (branches)

Create and update are admin and superadmin only. Branch-scoped roles can read.

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/api/admin/locations` | All roles, branch-scoped | Adds `staff_count` (assignment rows, not global admins) |
| GET | `/api/admin/locations/:id` | Branch-scoped | |
| POST | `/api/admin/locations` | admin, superadmin | `slug` generated from `name` when omitted |
| PATCH | `/api/admin/locations/:id` | admin, superadmin | Partial |
| DELETE | `/api/admin/locations/:id` | admin, superadmin | Sets `status = inactive`. The row and its orders stay |
| GET | `/api/admin/locations/:id/menu` | Branch-scoped | Every product with `price`, `inherited_price`, `effective_price`, `available`, `sort_order` |
| PUT | `/api/admin/locations/:id/menu` | Branch-scoped | Upsert branch menu lines |
| GET | `/api/admin/locations/:id/deals` | Branch-scoped | Branch deal lines |
| PUT | `/api/admin/locations/:id/deals` | Branch-scoped | Upsert branch deal lines |

Location body: `name`, `address`, `hours`, `phone` required; optional `slug` (lowercase-hyphen), `postcode`, `city`, `lat`, `lng`, `status` (`active` | `inactive`), `delivery_enabled`, `collection_enabled`, `delivery_fee`, `free_delivery_threshold` (null inherits company settings), `sort_order`.

**Coming soon branches.** The super admin Branches form offers a `Coming soon` status, which saves `hours: "Coming Soon"` and keeps `status: active`. The API has no separate coming soon flag: the hours text is the marker. The storefront badge and the location search treat it as its own state: the branch stays searchable by name, distance search prefers open branches, and any coming soon match is labelled `Coming Soon`. Setting real hours in the form opens the branch.

Branch menu write:

```json
{ "items": [{ "menu_item_id": "mock-burger-crispy", "price": 9.25, "available": true, "sort_order": null }] }
```

Branch deal write:

```json
{ "deals": [{ "deal_id": "mock-deal-wings", "price": null, "available": false }] }
```

A null `price` clears the override and inherits the global price.

---

## Admin — Orders

Branch-scoped. Managers never see orders with no branch.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/orders` | Optional `?status=`, `?location_id=`. Newest first. Items nested |
| GET | `/api/admin/orders/:id` | `{ order, items }` |
| PATCH | `/api/admin/orders/:id/status` | `{ "status": "preparing" }` |

Every order payload adds `location_name` and `allowed_statuses` (the legal next statuses). Totals and prices are the stored snapshot, never current catalogue prices.

Statuses: `pending`, `preparing`, `ready`, `out-for-delivery`, `delivered`, `cancelled`.

| From | Collection | Delivery |
|---|---|---|
| `pending` | `preparing`, `cancelled` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled` | `ready`, `cancelled` |
| `ready` | `delivered`, `cancelled` | `out-for-delivery`, `cancelled` |
| `out-for-delivery` | — | `delivered` |
| `delivered`, `cancelled` | — | — |

Illegal transition → 400. Another branch → 403. A concurrent update landed first → 409. A successful change emails the customer.

---

## Admin — Customers

Branch-scoped through orders: a manager sees a customer only if they have an order at an assigned branch, and only those orders.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/customers` | Optional `?q=` (case-insensitive contains on name, email, phone). Rows include order count, latest in-scope order, created date |
| GET | `/api/admin/customers/:id` | Profile plus in-scope orders. 404 when out of scope |

---

## Admin — Staff

Super admins manage branch managers and staff. Branch managers manage staff assigned to their own branches. Staff members cannot access Team.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/staff` | Name, email, role, position, `is_active`, assigned branch names |
| GET | `/api/admin/staff/:id` | |
| POST | `/api/admin/staff` | `name`, `email`, `password` (≥8 chars), `role`, optional `position`, `tabs`, `branchIds` |
| PATCH | `/api/admin/staff/:id` | Any of `name`, `email`, `password`, `role`, `position`, `tabs`, `branchIds`, `is_active` |
| POST | `/api/admin/staff/:id/deactivate` | Keeps the row and assignments. You cannot deactivate yourself |
| POST | `/api/admin/staff/:id/activate` | |
| PUT | `/api/admin/staff/:id/branches` | `{ "branchIds": ["..."] }` replaces assignments |

`role`: `superadmin` | `branch_manager` | `staff`. Branch managers and staff need at least one real branch. Branch managers can only add staff within their assigned branches and grant access they hold themselves. Up to 20 branch ids.

---

## Admin — CMS

`/api/admin/cms`. Superadmin only; admins and branch managers get 403.

| Method | Path | Notes |
|---|---|---|
| GET | `/pages` | Every CMS page: `id`, `label`, `detail`, `path`, `sortable`, `sectionCount` |
| GET | `/pages/:page` | `?locale=en|ur`. Creates any missing section rows, then returns each section with its field `definition`, the `content` to edit, `translation` or null, `copied_from_english`, and `coverage` per locale |
| PATCH | `/sections/:id` | `{ locale?, content?, is_active?, is_published? }`. Upserts that locale's copy. Returns the page |
| POST | `/sections/:id/move` | `{ "direction": "up" | "down" }`. Only on sortable pages and unpinned sections, else 400 |
| POST | `/sections/:id/reset` | `{ "locale": "en" | "ar" }`. Deletes that locale's copy, so English or the default shows |

`content` is checked against the section's registry fields. Unknown keys are rejected. Errors come back as 400 with the field path.

| Field kind | Rule |
|---|---|
| `text` | Plain text up to the field's `max`, no `<` or `>` |
| `image`, `video` | `https://…` or `/images/…` |
| `link` | A storefront path (`/`, `/menu`, `/locations`, `/franchise-inquiries`, `/delivery`, `/orders`, `/checkout`, optionally with one sub-path). Fields marked `external` also accept `https://` |
| `url` | `https://` only; some fields are limited to hosts such as `instagram.com` |
| `number`, `select`, `toggle` | Within the field's range or options |
| `list` | Up to the field's `max` items; object items are strict |

Section rules: `site.ordering` needs an `https://` `redirectUrl` when `mode` is `redirect`.

---

## Admin — Settings

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/settings` | Singleton |
| PUT | `/api/admin/settings` | `{ "delivery_fee": 2.99, "free_delivery_threshold": 20 }`. Writes `id = 1` |

These values are editable but not yet applied at checkout.

---

## Admin — Jobs and applications

Every route below is limited to `superadmin` and `branch_manager`, and a branch manager only sees and writes their own assigned branches. A branch manager's branch is re-checked server-side on create and on any change of branch.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/jobs` | Optional `?status=`, `?q=`, `?location_id=`. Scoped to the caller's branches |
| GET | `/api/admin/jobs/field-values` | `{ branches: [{ id, name }], types: string[] }` for the create/edit forms |
| GET | `/api/admin/jobs/:id` | 404 for a post outside the caller's branches |
| POST | `/api/admin/jobs` | `title`, `location_id`, `type`, `salary`, `description`, `requirements` (non-empty string array), optional `status` (`draft` \| `active` \| `closed`). `location` is written by the server from the branch name |
| PUT | `/api/admin/jobs/:id` | Partial. Send `location_id` only to move the post to another branch |
| PATCH | `/api/admin/jobs/:id/status` | `{ "status": "closed" }` |
| DELETE | `/api/admin/jobs/:id` | Cascades applications |
| GET | `/api/admin/job-applications` | Optional `?job_post_id=`, `?status=`, `?q=`. Scoped through the post |
| GET | `/api/admin/job-applications/:id` | |
| POST | `/api/admin/job-applications` | Manual entry. `job_post_id` plus the public apply fields |
| PUT | `/api/admin/job-applications/:id` | `status`, `notes` |
| PATCH | `/api/admin/job-applications/:id/status` | `{ "status": "reviewed" }` |
| DELETE | `/api/admin/job-applications/:id` | |

Job status: `draft`, `active`, `closed`. Only `active` posts are public. `type` is free text, not an enum; `field-values` returns the values already in use as suggestions.

---

## Admin — Dashboard

### `GET /api/admin/dashboard/stats`

```json
{ "total_orders": 42, "active_orders": 5, "revenue": 456.78, "today_revenue": 89.5 }
```

`total_orders` is all orders, `active_orders` is status not `delivered`/`cancelled`, `revenue` sums `total` including cancelled, `today_revenue` sums `total` since 00:00 UTC today including cancelled. Company-wide for every role; not branch-scoped.

---

## Emails (Resend)

| Trigger | Recipient |
|---|---|
| Order created | Customer confirmation, plus a new-order notice to `ADMIN_EMAIL` |
| Status `cancelled` | Customer cancellation |
| Status `delivered` | Customer delivered |
| Any other status | Customer status update |
| `POST /api/franchise/brochure` | Customer brochure link, plus a lead notice to `ADMIN_EMAIL` |

Emails are attempted after commit. A send failure is logged and never rolls back a write.

---

## Testing

`pnpm test` runs `server/tests/` with `tsx --test`. The suites hit the configured database, so run them against a development database. Coverage includes branch access rules, the order status workflow, checkout re-pricing, quote rules, CMS validation, staff permissions, job scoping, and pagination. There are no browser end-to-end tests.

---

## Rules that must keep holding

- The browser never talks to Postgres. Express is the only database client.
- Response envelopes stay compatible with `client/lib/api.ts`.
- The server prices every order line. Client prices are never stored.
- Order lines are snapshots and are never rewritten by catalogue edits.
- `orders.location_id`, `order_items.menu_item_id`, and `order_items.deal_id` stay nullable with `ON DELETE SET NULL`.
- New orders start as `pending`. Status changes follow the transition table and email the customer.
- Branch managers only see their assigned branches. `admin` and `superadmin` need no access rows.
- `hours: "Coming Soon"` stays the single marker for a branch that is not open yet.
- Schema changes go through a new migration folder, never `prisma db push`.
