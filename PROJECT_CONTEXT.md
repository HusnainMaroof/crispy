# Crispies — Project Context

**Crispies** is a fast-food ordering website (burgers + chicken) built as a **pnpm monorepo** with two application sides and an Express BFF server backed by Supabase.

---

## What This Project Is

A production-ready fullstack ordering platform with:
- A **customer-facing storefront** (`client/app/(store)/`) — browse menu, place orders, find locations, contact, careers
- An **admin dashboard** (`client/app/admin/`) — manage menu, categories, deals, orders, locations, settings, jobs, applications
- A **BFF (Backend-for-Frontend) Express server** (`server/`) — proxies all data between the client and Supabase, handles admin auth with custom JWTs

---

## Tech Stack

### Client (`client/`)

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) |
| UI Library | **React 19** |
| Language | **TypeScript 5** (strict mode, no `any`) |
| Styling | **Tailwind CSS v4** (no CSS modules, no styled-components) |
| State (global) | **Redux Toolkit** (`@reduxjs/toolkit`, `react-redux`) |
| Animation | **GSAP** (`gsap`, `@gsap/react`) + **Lenis** (smooth scroll) |
| Fonts | `Bebas_Neue`, `Oswald`, `Plus_Jakarta_Sans`, `Teko` (via next/font) |
| Toasts | `react-hot-toast` |
| Package manager | **pnpm** |

### Server (`server/`)

| Layer | Technology |
|---|---|
| Runtime | **Node.js** (LTS >= 20) |
| Framework | **Express 4** |
| Language | **TypeScript 5** (strict mode) — ESM (`"type": "module"`) |
| Validation | **Zod** |
| Logging | **Pino** + `pino-http` |
| Database | **Supabase** (PostgreSQL) via `@supabase/server` + `@supabase/supabase-js` |
| Auth (admin) | **Custom JWT** (`jsonwebtoken`) — verified against `JWT_SECRET`, NOT JWKS |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Cookies | `cookie-parser` |
| Compression | `compression` |

---

## Architecture

### Server Layered Pattern

```
Routes (validation only) → Controllers (static methods) → Services (business logic) → Supabase

Middleware Pipeline:
  helmet → cors → compression → cookieParser → body parsers → pino logger → rate limiter → routes → errorHandler
```

- **Routes** (`server/src/routes/`) — Zod schema validation + method delegation. No try/catch.
- **Controllers** (`server/src/controllers/`) — static methods, use `sendSuccess`/`sendError` utilities.
- **Services** (`server/src/services/`) — business logic, throw typed exceptions from `app-error.ts`.
- **Middleware** — `asyncHandler` wraps every controller; `errorHandler` catches AppError + Zod errors.

### Client Data Flow

```
Pages (useEffect on mount)
  → dispatch(Redux thunk)
    → api.get/post/patch()   [lib/api.ts]
      → fetch("/api/...")    [Next.js rewrites → Express :3001]
```

- **`lib/api.ts`** — central fetch wrapper with JWT management, auto-retry on 401/429.
- **Redux slices** — `cart`, `menu`, `locations`, `settings`.
- **Mock fallback** — `lib/data/*` used when Express is unavailable.
- **Cart** — entirely client-side (Redux + localStorage).

---

## Directory Layout

```
client/
  app/                  # Next.js App Router
    (store)/            # Storefront routes (serves "/")
    admin/              # Admin routes at "/admin"
  components/
    ui/                 # Shared primitives (wordmark)
    store/              # Storefront-specific components
    admin/              # Admin-specific components
  lib/
    api.ts              # Fetch wrapper
    redux/              # Redux store + slices
    admin/              # Admin React hooks
    data/               # Mock data (fallback)
  public/

server/
  src/
    config/             # env.ts, supabase.ts, http.ts
    controllers/        # admin/, store/ (static methods)
    middleware/         # auth, error-handler, rate-limiter, logger, validate
    routes/             # admin/, menu.ts, store.ts, actions.ts
    services/           # admin.service, menu.service, order.service, store.service
    types/              # DB-matching TypeScript types
    utils/              # app-error.ts, response.ts
    validators/         # Zod schemas
    index.ts            # Express app bootstrap
  supabase/
    migrations/         # SQL migrations
    seed.ts
```

---

## API Surface

All under `/api` — proxied by Next.js rewrites from `:3000` to Express at `:3001`.

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/menu/full` | Categories with nested items |
| GET | `/menu/categories` | Flat category list |
| GET | `/menu/items?category_id=` | Flat item list |
| GET | `/menu/deals` | Active deals |
| GET | `/store/locations` | All locations |
| GET | `/store/locations/:id` | Single location |
| GET | `/store/location` | Cookie-stored location |
| PATCH | `/store/location` | Set location cookie |
| GET | `/store/settings` | Business settings |
| POST | `/orders` | Create order |
| POST | `/contact` | Submit contact form |
| POST | `/jobs/:id/apply` | Apply for job |
| GET | `/health` | Health check |

### Admin Endpoints (JWT-protected)

| Method | Path |
|---|---|
| POST | `/admin/auth/login`, GET `/admin/auth/me` |
| CRUD | `/admin/categories` |
| CRUD | `/admin/menu` |
| CRUD | `/admin/deals` (+ PATCH toggle) |
| GET/PATCH | `/admin/orders`, `/admin/orders/:id/status` |
| GET/PATCH | `/admin/locations` |
| GET/PUT | `/admin/settings` |
| CRUD+PATCH | `/admin/jobs` (status toggle) |
| CRUD | `/admin/job-applications` |
| GET | `/admin/dashboard/stats` |

---

## Database

**11 tables**: `menu_categories`, `menu_items`, `deals`, `locations`, `orders`, `order_items`, `business_settings`, `job_posts`, `job_applications`, `contact_messages`, `admin_profiles`

- **RLS enabled** — anon: SELECT on public tables + INSERT on orders/contact/applications. Admin: all ops via `private.is_admin()` security definer.
- **Enums**: `fulfilment_type`, `payment_method`, `order_status`, `job_status`, `application_status`, `admin_role`
- **Text PKs** (UUID v4) for low-volume tables, `bigint identity` for high-volume (orders, order_items, business_settings, contact_messages).
- **Triggers**: `update_updated_at()` on all tables with `updated_at`.

---

## Brand System

- Background: `#000000` (black)
- Text: `#FFFFFF` (white) and `#DC2626` (brand-red)
- Secondary text: opacity-based (`text-white/70`)
- SVG wordmark in `components/ui/wordmark.tsx`
- No CSS modules or styled-components — Tailwind only

---

## Conventions & Rules

- **TypeScript strict** — no `any` anywhere.
- **Server Components by default** — `"use client"` only for interactivity.
- **No cross-import** — admin and storefront components never import from each other.
- **No comments in code** — unless explaining a non-obvious decision.
- **Tailwind only** — no CSS modules, no styled-components, no CSS-in-JS.
- **Static controller methods** — controllers are objects with static async methods.
- **Named exceptions** — services throw `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`, `InternalServerException`.
- **Zod in routes** — validation only at route level, never in controllers/services.
- **asyncHandler everywhere** — no raw try/catch in route handlers.
- **Consistent responses** — `{ success: true, data: ... }` / `{ success: false, error: "...", code: "..." }`.

---

## Commands

### Client (`client/`)
```
pnpm dev         # Dev server :3000
pnpm build       # Production build
pnpm start       # Serve production build
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
```

### Server (`server/`)
```
pnpm dev         # tsx watch :3001
pnpm build       # tsc
pnpm start       # node dist/index.js
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm migrate     # supabase db push
pnpm seed        # tsx supabase/seed.ts
pnpm db:reset    # supabase db reset
```

---

## Environment Variables

### `client/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### `server/.env`
```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
JWT_SECRET=
```

---

## Known Gotchas

- Cart is client-side only (Redux + localStorage) — no server-side cart.
- Mock data directory (`lib/data/`) exists but may be empty.
- No location selector UI in checkout flow yet.
- Deals section on homepage is hardcoded promotional content — not wired to API.
- Auth token refresh endpoint (`POST /admin/auth/refresh`) is called by client but not implemented on server.
- `lib/mappers.ts` listed in directory layout but does not exist yet.
- Windows dev environment (PowerShell 5.1) — use full cmdlet names in scripts.
