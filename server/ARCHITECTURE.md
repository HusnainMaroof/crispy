# Crispies Server — Architecture

## Overview

The server is a **Backend-for-Frontend (BFF)** Express application that sits between the Next.js client and Supabase. It exposes RESTful JSON endpoints under `/api`, handles admin authentication with custom JWTs, and uses a service-role Supabase client for all database operations.

```
Client (Next.js :3000)
  │  Next.js rewrites /api/* -> localhost:3001
  ▼
Express BFF (:3001)
  │  Service-role Supabase client (bypasses RLS)
  ▼
Supabase (PostgreSQL + Auth)
```

---

## Directory Layout

```
src/
  config/        # Environment, Supabase client, HTTP status codes
  controllers/   # Route handlers (static methods, no logic)
  middleware/     # Auth, error handling, rate limiting, logging, validation
  routes/        # Route definitions + Zod validation
  services/      # Business logic, Supabase queries
  types/         # TypeScript interfaces (DB models, API responses)
  utils/         # Error classes, response helpers, async wrapper
  validators/    # Zod schemas
  index.ts       # Express app bootstrap
supabase/
  migrations/    # SQL migration files
```

---

## Layered Architecture

### Request Lifecycle

```
Incoming Request
  │
  ▼
helmet()                        → Security headers
cors()                          → CORS
compression()                   → Gzip
cookieParser()                  → Cookie parsing
express.json() / urlencoded()   → Body parsing
httpLogger                      → Pino HTTP logging
rate limiter                    → Global (100/15min) or auth (10/15min)
  │
  ▼
Route                           → URL matching, method delegation
  │
  ▼
validate(Zod schema)            → Request body/query/params validation
  │
  ▼
asyncHandler                    → Wraps controller, catches async errors
  │
  ▼
Controller                      → Static method, calls service, sends response
  │
  ▼
Service                         → Business logic, Supabase queries, throws AppError
  │
  ▼
errorHandler                    → Catches AppError + unexpected errors
```

### Layer Responsibilities

| Layer | Role | Error Handling |
|---|---|---|
| **Routes** (`routes/`) | Match URL patterns, attach validation middleware, delegate to controller | None — no try/catch |
| **Validators** (`validators/`) | Zod schemas for request body/query/params | Throws ZodError caught by `errorHandler` |
| **Controllers** (`controllers/`) | Extract params from `req`, call service, call `sendSuccess`/`sendError` | Only via `asyncHandler` wrapper |
| **Services** (`services/`) | Business logic, Supabase queries, data transformation | Throw typed `AppError` subclasses |
| **Middleware** (`middleware/`) | Cross-cutting concerns (auth, logging, rate limiting) | `errorHandler` catches all |

---

## Key Patterns

### 1. Static Controller Methods

Controllers are plain objects with static async methods — no classes, no instantiation.

```ts
export const MenuController = {
  async full(_req: Request, res: Response) {
    const menu = await getFullMenu();
    sendSuccess(res, menu);
  },
};
```

### 2. Named Exception Classes

Services throw typed exceptions from `utils/app-error.ts`:

| Exception | HTTP Status | Error Code |
|---|---|---|
| `BadRequestException` | 400 | `ERR_BAD_REQUEST` |
| `UnauthorizedException` | 401 | `ERR_UNAUTHORIZED` |
| `ForbiddenException` | 403 | `ERR_FORBIDDEN` |
| `NotFoundException` | 404 | `ERR_NOT_FOUND` |
| `ConflictException` | 409 | `ERR_CONFLICT` |
| `InternalServerException` | 500 | `ERR_INTERNAL` |

All extend `AppError` which carries `statusCode` and `errorCode`. These are caught by `errorHandler` which maps them to consistent JSON responses.

### 3. asyncHandler Wrapper

Every route handler is wrapped with `asyncHandler` to forward rejected promises to the Express error middleware:

```ts
router.get("/items", asyncHandler(MenuController.items));
```

Without this, thrown errors in async controllers would cause unhandled promise rejections.

### 4. Zod Validation in Routes

Validation happens **at the route level**, before the controller is called:

```ts
router.post("/", validate(createOrderSchema), asyncHandler(ActionsController.createOrder));
```

The `validate` middleware parses `req.body` (or `req.query`/`req.params`) against a Zod schema, replaces `req.body` with the parsed data, and returns a 400 with field errors if validation fails.

### 5. Consistent Response Format

```ts
// Helper functions in utils/response.ts
sendSuccess(res, data, status?)   // { success: true, data }
sendPaginated(res, data, pagination)  // { success: true, data, pagination }
sendError(res, message, status?)  // { success: false, error }
```

### 6. Admin Auth

Auth uses a **custom JWT** (not Supabase JWKS):

1. **Login**: Email/password → Supabase Auth → check `admin_profiles` table → sign JWT with `JWT_SECRET` (7d expiry)
2. **Verify**: `authenticate` middleware extracts `Bearer <token>`, verifies with `jsonwebtoken`, attaches `req.admin` payload `{ sub, email, role }`
3. **Role guard**: `requireRole("admin", "superadmin")` middleware restricts by role

### 7. Supabase Client

- `getAdminClient()` — Singleton service-role client (bypasses RLS). Used for all server-side DB operations.
- `getContextClient(opts?) — Creates a context-aware client (for user-scoped queries).

Both use `@supabase/server/core` (`createAdminClient` / `createContextClient`).

### 8. Rate Limiting

- **Global limiter**: 100 requests / 15 min per IP (skipped for `/api/admin/*` routes)
- **Auth limiter**: 10 requests / 15 min per IP (applied to `/api/admin/auth`)
- **Admin limiter**: 100 requests / 15 min per IP (applied to all `/api/admin/*` endpoints)
- Health check (`/health`) is exempt from rate limiting

---

## API Surface

### Public Endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/menu/full` | Categories with nested items |
| GET | `/api/menu/categories` | Flat category list |
| GET | `/api/menu/items` | Flat item list (optional `?category_id=`) |
| GET | `/api/menu/deals` | Active deals |
| GET | `/api/store/locations` | All locations |
| GET | `/api/store/locations/:id` | Single location |
| GET | `/api/store/location` | Location from cookie |
| PATCH | `/api/store/location` | Set location cookie |
| GET | `/api/store/settings` | Business settings |
| POST | `/api/orders` | Create order |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/jobs/:id/apply` | Apply for job |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Login (no JWT required) |
| GET | `/api/admin/auth/me` | Current admin profile |
| GET/POST | `/api/admin/categories` | List / Create |
| GET/PUT/DELETE | `/api/admin/categories/:id` | Read / Update / Delete |
| GET/POST | `/api/admin/menu` | List / Create menu items |
| GET/PUT/DELETE | `/api/admin/menu/:id` | Read / Update / Delete |
| GET/POST | `/api/admin/deals` | List / Create deals |
| PUT/PATCH/DELETE | `/api/admin/deals/:id` | Update / Toggle active / Delete |
| GET | `/api/admin/orders` | List (filter by `?status=`, `?location_id=`) |
| GET | `/api/admin/orders/:id` | Single order with items |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| GET/POST | `/api/admin/locations` | List / Create locations |
| PATCH/DELETE | `/api/admin/locations/:id` | Update / Delete |
| GET/PUT | `/api/admin/settings` | Read / Update settings |
| GET/POST | `/api/admin/jobs` | List / Create job posts |
| GET/PUT/PATCH/DELETE | `/api/admin/jobs/:id` | Read / Update / Toggle status / Delete |
| GET/POST | `/api/admin/job-applications` | List / Create applications |
| GET/PUT/PATCH/DELETE | `/api/admin/job-applications/:id` | Read / Update / Update status / Delete |
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |

---

## Database Schema

**11 tables** in Supabase (PostgreSQL):

| Table | PK | Notes |
|---|---|---|
| `menu_categories` | `text` (UUID) | Low-volume lookup, `sort_order` |
| `menu_items` | `text` (UUID) | FK → `menu_categories`, `badge_variant` check |
| `deals` | `text` (UUID) | Active toggle, `badge_variant` check |
| `locations` | `text` (UUID) | `lat`/`lng` numeric(10,7) |
| `orders` | `bigint identity` | FK → `locations`, status enum |
| `order_items` | `bigint identity` | FK → `orders`, FK → `menu_items` |
| `business_settings` | `bigint identity` | Singleton row |
| `job_posts` | `text` (UUID) | `requirements` as JSONB |
| `job_applications` | `text` (UUID) | FK → `job_posts`, status enum |
| `contact_messages` | `bigint identity` | `type` check constraint |
| `admin_profiles` | `uuid` | Matches Supabase Auth user UUID |

**Enums**: `fulfilment_type`, `payment_method`, `order_status`, `job_status`, `application_status`, `admin_role`

**RLS**: Anon has SELECT on public tables + INSERT on orders/contact/applications. Admin uses `private.is_admin()` security definer function. All server queries use a service-role client that bypasses RLS entirely.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/publishable key |
| `SUPABASE_SECRET_KEY` | Yes | Service role key |
| `JWT_SECRET` | Yes | Secret for signing admin JWTs |
| `PORT` | No | Server port (default: 4000) |
| `CORS_ORIGIN` | No | Allowed origin (default: `http://localhost:3000`) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `RATE_LIMIT_MAX` | No | Global rate limit (default: 100) |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `NODE_ENV` | No | `development` / `production` / `test` |

---

## Migration & Seed

- Migrations live in `supabase/migrations/` as plain SQL files
- `pnpm migrate` runs `supabase db push`
- `pnpm seed` runs `tsx supabase/seed.ts`
- `pnpm db:reset` runs `supabase db reset`

---

## Security Review

**Review date**: July 2026
**Scope**: `server/src/` — Express application only (client excluded)
**Methodology**: Manual code review tracing data flow from attacker-controlled input to sinks.

### Summary

No critical or high-severity vulnerabilities identified. The codebase follows security best practices consistently: all database queries use parameterized Supabase builder methods, all mutation endpoints have Zod validation acting as an allowlist, JWT verification is standard, error handling does not leak stack traces, and no secrets are hardcoded.

### Positive Highlights

| Area | Status |
|---|---|
| SQL injection | Not possible — all queries use Supabase query builder (parameterized) |
| Mass assignment | Mitigated — Zod validation acts as allowlist; only schema-defined fields reach services |
| Auth tokens | Signed with `JWT_SECRET`, verified by `jsonwebtoken.verify()` (includes expiry check) |
| Error disclosure | No stack traces in production responses; `errorHandler` returns generic messages |
| Security headers | `helmet()` applied globally with defaults |
| CORS | Scoped to configured origin (`CORS_ORIGIN` env var, default `http://localhost:3000`) |
| Secrets | None hardcoded — all keys loaded from environment via `env.ts` |
| Auth rate limit | 10 requests / 15 min on `/api/admin/auth` |

### Findings

#### [SEC-001] Missing Input Validation on `PATCH /api/store/location` (Low) — RESOLVED

- **Location**: `routes/store.ts:10` → `controllers/store/store.controller.ts:37`
- **Confidence**: High
- **Issue**: The endpoint sets a location cookie but has no Zod validation middleware attached. The controller performs only a manual truthiness check (`if (!location_id)`).
- **Impact**: Minimal. The `location_id` value is passed to `getLocationById()` which queries Supabase with a parameterized `.eq("id", id)` — no injection risk. Missing validation means invalid types (e.g. objects, arrays) reach the controller, which casts them to string and fails with a Supabase error (caught as `InternalServerException`).
- **Fix**: Added `setLocationSchema` to `validators/order.schema.ts` and `validate(setLocationSchema)` middleware to the route. Removed manual truthiness check from controller.

#### [SEC-002] Location Cookie Lacks `httpOnly` Flag (Low) — RESOLVED

- **Location**: `controllers/store/store.controller.ts:5-10`
- **Confidence**: High
- **Issue**: The `crispy_location_id` cookie is set with `secure: true` and `sameSite: "lax"` but no `httpOnly: true`.
- **Impact**: Minimal. The cookie stores only a location preference ID — not a session token or sensitive data. However, if an XSS vulnerability existed elsewhere in the stack, the cookie would be readable via `document.cookie`.
- **Fix**: Added `httpOnly: true` to `COOKIE_OPTIONS`.

#### [SEC-003] No Rate Limiting on Admin Endpoints (Low) — RESOLVED

- **Location**: `index.ts:38-41`
- **Confidence**: High
- **Issue**: The global rate limiter explicitly bypasses all `/api/admin/*` routes. While these routes are JWT-protected, there is no secondary rate limit on authenticated requests. A compromised or leaked admin token could be used to hammer admin endpoints without restriction.
- **Impact**: Low — requires a compromised JWT. Admin auth is already throttled at login (10/15min), but once authenticated, all CRUD operations are unlimited.
- **Fix**: Added `adminLimiter` (100 req / 15 min) in `middleware/rate-limiter.ts` and applied it to `/api/admin` in `index.ts`.

#### [SEC-004] Unvalidated Route Parameters on Multiple Endpoints (Info) — RESOLVED

- **Location**: Several route handlers across `controllers/admin/` and `controllers/store/`
- **Confidence**: High
- **Issue**: Route parameters like `/menu/items?category_id=` and `/:id` path params are extracted with bare `as string` casts without Zod validation. Example:
  ```ts
  // controllers/store/menu.controller.ts:17
  const categoryId = req.query.category_id as string | undefined;
  ```
- **Impact**: None exploitable. All values flow into Supabase query builder methods (`.eq()`, `.filter()`) which parameterize the inputs. No raw SQL or system commands are constructed from these values.
- **Fix**: Added `menuItemsQuerySchema` to `validators/menu.schema.ts` with `validate(menuItemsQuerySchema, "query")` middleware on `GET /api/menu/items`.

### Notes

- **Token refresh**: The client references `POST /api/admin/auth/refresh` but the endpoint is not implemented on the server. When the 7-day JWT expires, admins will be logged out without the ability to refresh silently — this is a functional gap, not a security vulnerability.
- **CSRF**: Not applicable. Auth is transmitted via `Authorization: Bearer` header (not cookies). The only cookie (`crispy_location_id`) is a non-sensitive preference.
- **Supabase service key**: The service-role key (`SUPABASE_SECRET_KEY`) is used server-side only, never exposed to the client. This is the correct BFF pattern.
