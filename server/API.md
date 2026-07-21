# API Reference

All endpoints are mounted under `/api`. Admin routes require a `Bearer <token>` Authorization header.

---

## Architecture

Layered BFF (Backend For Frontend): Next.js rewrites proxy `/api/*` to Express on port 3001. Express uses a service-role Supabase client internally; cart stays client-side (Redux + localStorage).

```
Client (Next.js :3000)
  │
  ├─ Storefront fetches → /api/*
  │   └─ Next.js rewrite proxies → Express :3001
  │
  └─ Admin fetches → /api/admin/*
      └─ Next.js rewrite proxies → Express :3001
```

```
Express :3001
  │
  ├─ middleware/auth.ts              ← JWT verify (Bearer token)
  ├─ middleware/identify-customer.ts ← anonymous cookie UUID (crispy_customer_id)
  ├─ middleware/rate-limiter.ts      ← global / auth / admin limiters
  ├─ middleware/logger.ts            ← pino HTTP logging
  ├─ middleware/error-handler.ts     ← catches named exceptions + Zod errors
  │
  ├─ routes/                    ← schema validation only, no logic
  │   ├─ public:  menu.ts, store.ts, actions.ts
  │   └─ admin:   auth.ts, categories.ts, menu.ts, deals.ts, ...
  │
  ├─ controllers/               ← thin req/res handlers, static methods
  │   └─ calls service functions
  │
  ├─ services/                  ← business logic, DB queries
  │   ├─ menu.service.ts        ← getFullMenu, getCategories, getMenuItems, getDeals
  │   ├─ order.service.ts       ← createOrder, getOrders, getOrderById, getOrdersByCustomerId, getOrdersByEmail, updateOrderStatus, getDashboardStats
  │   ├─ admin.service.ts       ← locations, settings, jobs, contact, job apps
  │   └─ store.service.ts       ← re-exports getLocations/getSettings + getLocationById
  │
  ├─ validators/                ← Zod schemas (validated in routes)
  │
  └─ Supabase (PostgreSQL)
       ├─ service-role client (getAdminClient) — bypasses RLS
       ├─ anon client (getAnonClient) — used only for signInWithPassword
       └─ RLS policies enforce access for anon/authenticated/admin
```

### Request lifecycle

1. Client sends `GET /api/menu/full`
2. Next.js rewrite proxies to `GET http://localhost:3001/api/menu/full`
3. Express route `routes/menu.ts` validates query params (if any)
4. `MenuController.full()` is called via `asyncHandler`
5. `getFullMenu()` in `menu.service.ts` runs:
   ```ts
   getAdminClient()
     .from("menu_categories")
     .select("*, menu_items(*)")
     .order("sort_order")
     .order("sort_order", { foreignTable: "menu_items" })
   ```
6. Supabase returns categories with nested items → one DB round-trip
7. Service filters active items in-memory and returns `CategoryWithItems[]`
8. Controller wraps in `{ success: true, data: [...] }` via `sendSuccess()`
9. If any step throws, `errorHandler` maps the named exception to an HTTP response

### How Supabase queries work

- `getAdminClient()` returns a **service-role client** that bypasses RLS — all data is accessible
- `.from("table").select("*")` builds a SQL query → Supabase returns JSON rows
- `.eq("col", val)` adds a `WHERE col = val` clause
- `.order("col")` adds an `ORDER BY`
- `.single()` expects exactly one row — returns error if 0 or 2+ rows
- `.limit(n)` caps the result set
- `.rpc("function_name", { params })` calls a Postgres function directly
- `.insert()` / `.update()` / `.delete()` modify rows, chained with `.select().single()` to return the result

### Auth flow

1. Login: `POST /api/admin/auth/login` with email + password
2. Controller creates anon Supabase client → `signInWithPassword()` → gets Supabase Auth user
3. Looks up `admin_profiles` row by user ID
4. Signs a custom JWT with `{ sub, email, role }` using `JWT_SECRET`
5. Client stores the token and sends `Authorization: Bearer <token>` on admin requests
6. `middleware/auth.ts` verifies the JWT, attaches `req.admin`
7. Controllers call `getAdminClient()` which uses the service-role key — not user-scoped

---

## Response Format

All successful responses:
```json
{ "success": true, "data": <payload> }
```

All error responses:
```json
{ "success": false, "error": "Human-readable message", "code": "ERR_NOT_FOUND" }
```

Error codes: `ERR_BAD_REQUEST`, `ERR_UNAUTHORIZED`, `ERR_FORBIDDEN`, `ERR_NOT_FOUND`, `ERR_CONFLICT`, `ERR_INTERNAL`, `ERR_TOO_MANY`, `ERR_VALIDATION`.

---

## Public — Health

### `GET /api/health`

**Response** `200`
```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

## Public — Menu

### `GET /api/menu/full`

Returns categories with their items nested inside.

**Response** `200`
```json
[
  {
    "id": "wings",
    "number": "01",
    "title": "Crispies Style Wings",
    "image": "https://...",
    "sort_order": 0,
    "created_at": "...",
    "updated_at": "...",
    "items": [
      {
        "id": "wings-5",
        "category_id": "wings",
        "name": "5 Wings",
        "description": "Five crispy golden wings...",
        "price": 5.99,
        "image": "https://...",
        "badge": null,
        "badge_variant": null,
        "sort_order": 0,
        "active": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
]
```

---

### `GET /api/menu/categories`

Flat list of menu categories.

**Query params** — none

**Response** `200` — `MenuCategory[]`

---

### `GET /api/menu/items`

Flat list of menu items (active only).

**Query params** — `?category_id=wings` (optional filter)

**Response** `200` — `MenuItem[]`

---

### `GET /api/menu/deals`

Active deals only.

**Response** `200` — `Deal[]`

---

## Public — Store

### `GET /api/store/locations`

All store locations.

**Response** `200`
```json
[
  {
    "id": "brixton",
    "name": "Crispies Brixton",
    "address": "45 Electric Lane, Brixton, London SW9 8JZ",
    "hours": "11:00 AM – 11:00 PM",
    "phone": "+44 20 7946 0123",
    "lat": null,
    "lng": null,
    "sort_order": 0,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### `GET /api/store/locations/:id`

Single location by ID.

**Response** `200` — `Location`
**Error** `404` — Not found

---

### `GET /api/store/location`

Returns location stored in the `crispy_location_id` cookie, or `null`.

**Response** `200`
```json
{ "success": true, "data": { ... } }
```

**Response** `200` (no cookie)
```json
{ "success": true, "data": null }
```

---

### `PATCH /api/store/location`

Sets `crispy_location_id` cookie to remember the user's preferred store.

**Request body**
```json
{ "location_id": "brixton" }
```

**Response** `200` — Location object
**Error** `400` — Missing or invalid `location_id`

---

### `GET /api/store/settings`

Business settings (delivery fee, free delivery threshold).

**Response** `200`
```json
{
  "id": 1,
  "delivery_fee": 2.99,
  "free_delivery_threshold": 20,
  "updated_at": "..."
}
```

---

### `GET /api/store/homepage`

Returns homepage content as a key→content map (rows from the `homepage_content` table).

**Response** `200`
```json
{
  "hero_title": { ... },
  "stats": [ ... ],
  "deals_cta": { ... }
}
```

---

### `GET /api/store/jobs`

Lists active job posts (public careers listing). Only posts with `status: "active"` are returned.

**Response** `200` — `JobPost[]` (see Admin — Jobs for the shape)

---

### `GET /api/store/jobs/:id`

Single active job post by ID.

**Response** `200` — `JobPost`
**Error** `404` — Not found

---

## Public — Actions

### `POST /api/orders`

Create an order.

**Request body**
```json
{
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+44 7123 456789",
  "address": "123 High Street",
  "postcode": "SW1A 1AA",
  "city": "London",
  "notes": "Ring the bell",
  "fulfilment": "delivery",
  "payment_method": "card",
  "location_id": "brixton",
  "subtotal": 15.97,
  "delivery_fee": 2.99,
  "total": 18.96,
  "items": [
    {
      "menu_item_id": "wings-5",
      "name": "5 Wings",
      "price": 5.99,
      "quantity": 2
    }
  ]
}
```

`address` / `postcode` / `city` can be `null` for collection.
`location_id` is optional — falls back to cookie if not provided.
`customer_id` is automatically set from the `crispy_customer_id` cookie (see middleware).

**Response** `201` — Created order
**Error** `400` — Validation failed

---

### `GET /api/orders/mine`

Returns orders linked to the current browser via the `crispy_customer_id` cookie. No auth required — the cookie is set on first visit by `identify-customer` middleware.

**Response** `200`
```json
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "fulfilment": "delivery",
    "subtotal": 15.97,
    "delivery_fee": 2.99,
    "total": 18.96,
    "created_at": "2025-01-01T12:00:00.000Z",
    ...
  }
]
```

Empty array if no orders are linked to this cookie.

---

### `POST /api/orders/lookup`

Look up orders by email address. Useful when the user is on a different device or cleared their cookies.

**Request body**
```json
{ "email": "john@example.com" }
```

**Response** `200` — `Order[]` (same shape as `GET /api/orders/mine`)
**Error** `400` — Invalid email

---

### `GET /api/orders/:id`

Returns a single order with its line items nested.

**Response** `200`
```json
{
  "order": { ... },
  "items": [
    {
      "id": 1,
      "menu_item_id": "wings-5",
      "name": "5 Wings",
      "price": 5.99,
      "quantity": 2
    }
  ]
}
```

**Error** `404` — Order not found

---

### `POST /api/contact`

Submit a contact form message.

**Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Order enquiry",
  "message": "I had a question about...",
  "type": "general"
}
```

`type` must be one of: `general`, `franchise`, `careers`, `press`.

**Response** `201` — Created message
**Error** `400` — Validation failed

---

### `POST /api/jobs/:id/apply`

Submit a job application for the given job post.

**Request body**
```json
{
  "applicant_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+44 7123 456789",
  "cv_url": "https://...",
  "cover_letter": "I am very interested..."
}
```

`job_post_id` is NOT sent in the body — it is taken from the URL `:id` param. (`phone`, `cv_url`, and `cover_letter` are optional.)

**Response** `201` — Created application
**Error** `400` — Validation failed

---

## Admin — Auth

### `POST /api/admin/auth/login`

Login with email and password via Supabase Auth, then checks admin profile.

**Request body**
```json
{ "email": "admin@crispies.com", "password": "..." }
```

**Response** `200`
```json
{
  "token": "eyJhbGciOiJI...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "admin" }
}
```

**Error** `401` — Invalid email or password
**Error** `403` — Not authorized as admin

---

### `POST /api/admin/auth/refresh`

Issues a fresh JWT from a still-valid token. Requires `Authorization: Bearer <token>`.

**Response** `200`
```json
{ "token": "eyJhbGciOiJI..." }
```

**Error** `401` — Missing or invalid token

---

### `GET /api/admin/auth/me`

Returns the authenticated admin's profile. Requires `Authorization: Bearer <token>`.

**Response** `200` — `AdminProfile`
**Error** `401` — Missing or invalid token

---

## Admin — Upload

### `POST /api/admin/upload`

Uploads a single image (`multipart/form-data`, field name `image`, max 5 MB). Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Used by the categories, menu items, and deals admin forms. Requires `Authorization: Bearer <token>`.

**Response** `201`
```json
{ "url": "https://res.cloudinary.com/.../crispies/xxxx.jpg" }
```

**Error** `400` — No file provided / invalid MIME type
**Error** `500` — Upload failed (Cloudinary credentials or permissions)

---

## Admin — Categories

### `GET /api/admin/categories`

List all categories (full menu with nested items).

### `GET /api/admin/categories/:id`

Single category by ID.

**Error** `404` — Not found

### `POST /api/admin/categories`

**Request body**
```json
{
  "id": "wings",
  "number": "01",
  "title": "Wings",
  "image": "https://...",
  "sort_order": 0
}
```

`id` is auto-generated via UUID if omitted.

**Response** `201` — Created category

### `PUT /api/admin/categories/:id`

Partial update (any field optional).

### `DELETE /api/admin/categories/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Menu Items

### `GET /api/admin/menu`

List all menu items (includes inactive). `?category_id=wings` to filter.

### `GET /api/admin/menu/:id`

Single menu item by ID.

**Error** `404` — Not found

### `POST /api/admin/menu`

**Request body**
```json
{
  "category_id": "wings",
  "name": "5 Wings",
  "description": "Five crispy golden wings...",
  "price": 5.99,
  "image": "https://...",
  "badge": null,
  "badge_variant": null,
  "sort_order": 0,
  "active": true
}
```

`id` is auto-generated via UUID if omitted.

**Response** `201` — Created item

### `PUT /api/admin/menu/:id`

Partial update.

### `DELETE /api/admin/menu/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Deals

### `GET /api/admin/deals`

List all deals (including inactive).

### `POST /api/admin/deals`

**Request body**
```json
{
  "name": "Wing + Side Combo",
  "description": "7 wings plus loaded fries...",
  "price": 9.99,
  "image": "https://...",
  "badge": "Popular",
  "badge_variant": null,
  "active": true
}
```

**Response** `201` — Created deal

### `PUT /api/admin/deals/:id`

Partial update.

### `PATCH /api/admin/deals/:id/toggle`

Flips the `active` boolean.

### `DELETE /api/admin/deals/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Orders

### `GET /api/admin/orders`

List orders. `?status=pending` or `?location_id=brixton` to filter. Each order includes its line items nested under `items` (a single DB join, no extra round-trip).

**Response** `200`
```json
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 7123 456789",
    "address": "123 High Street",
    "postcode": "SW1A 1AA",
    "city": "London",
    "notes": null,
    "fulfilment": "delivery",
    "payment_method": "card",
    "subtotal": 15.97,
    "delivery_fee": 2.99,
    "total": 18.96,
    "status": "pending",
    "location_id": "brixton",
    "created_at": "...",
    "updated_at": "...",
    "items": [
      { "id": 1, "order_id": 1, "menu_item_id": "wings-5", "name": "5 Wings", "price": 5.99, "quantity": 2, "created_at": "..." }
    ]
  }
]
```

### `GET /api/admin/orders/:id`

Single order with its items nested.

**Response** `200`
```json
{
  "order": { ... },
  "items": [ ... ]
}
```

**Error** `404` — Not found

### `PATCH /api/admin/orders/:id/status`

**Request body**
```json
{ "status": "preparing" }
```

Status values: `pending`, `preparing`, `ready`, `out-for-delivery`, `delivered`, `cancelled`.

---

## Admin — Locations

### `GET /api/admin/locations`

All locations.

### `POST /api/admin/locations`

**Request body**
```json
{
  "name": "Crispies Brixton",
  "address": "45 Electric Lane, London SW9 8JZ",
  "hours": "11:00 AM – 11:00 PM",
  "phone": "+44 20 7946 0123",
  "lat": 51.4613,
  "lng": -0.1155,
  "sort_order": 0
}
```

`id` is auto-generated via UUID. `sort_order` defaults to `0`.

### `PATCH /api/admin/locations/:id`

Partial update (any field).

### `DELETE /api/admin/locations/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Settings

### `GET /api/admin/settings`

Business settings (singleton row).

### `PUT /api/admin/settings`

**Request body**
```json
{ "delivery_fee": 2.99, "free_delivery_threshold": 20 }
```

---

## Admin — Jobs

### `GET /api/admin/jobs`

List job posts. `?status=active` to filter.

### `GET /api/admin/jobs/:id`

Single job post by ID.

**Error** `404` — Not found

### `POST /api/admin/jobs`

**Request body**
```json
{
  "title": "Kitchen Staff",
  "location": "Brixton",
  "type": "Full-time",
  "salary": "£11.50/hr",
  "description": "We are looking for...",
  "requirements": ["Experience preferred", "Team player"],
  "status": "active"
}
```

`id` is auto-generated via UUID. `applications` starts at `0`.

**Response** `201` — Created job post

### `PUT /api/admin/jobs/:id`

Partial update (any field).

### `PATCH /api/admin/jobs/:id/status`

**Request body**
```json
{ "status": "closed" }
```

Status values: `draft`, `active`, `closed`.

### `DELETE /api/admin/jobs/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Job Applications

### `GET /api/admin/job-applications`

List job applications. `?job_post_id=kitchen-staff-brixton` or `?status=pending` to filter.

### `GET /api/admin/job-applications/:id`

Single application by ID.

**Error** `404` — Not found

### `POST /api/admin/job-applications`

**Request body**
```json
{
  "job_post_id": "kitchen-staff-brixton",
  "applicant_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+44 7123 456789",
  "cv_url": "https://...",
  "cover_letter": "I am very interested..."
}
```

**Response** `201` — Created application

### `PUT /api/admin/job-applications/:id`

Partial update (any field — notes, status, etc.).

### `PATCH /api/admin/job-applications/:id/status`

**Request body**
```json
{ "status": "reviewed" }
```

Status values: `pending`, `reviewed`, `shortlisted`, `rejected`, `hired`.

### `DELETE /api/admin/job-applications/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Dashboard

### `GET /api/admin/dashboard/stats`

**Response** `200`
```json
{
  "total_orders": 42,
  "active_orders": 5,
  "revenue": 456.78,
  "today_revenue": 89.50
}
```

---

## Rate Limiting

- **Global**: 100 requests per 15 minutes per IP (skipped for admin routes)
- **Auth routes** (`/api/admin/auth`): 10 requests per 15 minutes per IP
- **Health check** (`/health`) is exempt

---

## Changelog

### 2026-07-19 — Anonymous order tracking

- **`GET /api/orders/mine`**: New endpoint returns orders linked to the `crispy_customer_id` cookie — no auth, just cookie-based anonymous identification.
- **`POST /api/orders/lookup`**: New endpoint to look up orders by email (fallback for cookie-less users).
- **`GET /api/orders/:id`**: Public endpoint for fetching a single order with items (previously admin-only).
- **`POST /api/orders`**: Now saves `customer_id` from the cookie so returning users see their order history.
- **`middleware/identify-customer.ts`**: New middleware that sets/reads the `crispy_customer_id` cookie (UUID, 1 year, httpOnly) on every request.
- **Database**: Added `customer_id text` column and index on `orders` table (migration 005).

### 2026-07-19 — Performance & architecture

- **`GET /api/menu/full`**: Optimized from 2 separate queries + in-memory join to a single Supabase DB join — reduces round-trips by 50%.
- **`GET /api/admin/dashboard/stats`**: Consolidated from 3 parallel queries into a single `get_dashboard_stats()` RPC call using aggregate filters (`count(*) filter (where ...)`).
- **`POST /api/jobs/:id/apply`**: Application counter increment now uses an atomic RPC function instead of a read-then-write fallback, eliminating a race condition.
- **`PUT /api/admin/settings`**: Removed redundant `getSettings()` read before update — targets `id=1` directly (singleton table).
- **Admin login**: Anon Supabase client is now cached as a singleton instead of created on every request.
- **Database**: Added composite indexes `menu_items(category_id, active)`, `orders(status, location_id)`, and `deals(active)` for common query patterns.
- **Type fix**: `getOrders()` `location_id` filter parameter corrected from `string | number` to `string` to match the UUID column type.
