# AGENTS.md

## Project

Crispies — fast-food ordering website (burgers + chicken). Monorepo with two
app sides: an admin dashboard and a customer-facing storefront, plus an Express
BFF server backed by Supabase.

## Current state

- `client/` — Next.js app (App Router, TypeScript, Tailwind v4). Storefront pages
  are wired to `/api` endpoints (menu, checkout, contact, find-us, home sections)
  via `lib/api.ts` with mock-data fallback. Pages use `useEffect` to fetch from
  API on mount and fall back to `lib/data/*` if the server is unavailable.
  Next.js rewrites proxy `/api` to the Express server.
- `server/` — Node.js + Express API with Supabase (PostgreSQL + Auth). BFF pattern:
  Express uses a Supabase service-role client internally, admin auth uses custom
  JWT middleware (not Supabase JWKS). Cart stays client-side (Redux + localStorage).
  Location cookie support via `cookie-parser` — `GET /api/store/location` reads
  `crispy_location_id`, `PATCH /api/store/location` sets it.

## Stack

- Client: Next.js 16 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS v4.
- Server: Node.js + Express, Zod validation, Pino logging, Supabase (Postgres + Auth).
- Admin auth: Custom JWT (jsonwebtoken) verified against `JWT_SECRET` — not JWKS.
- Package manager: **pnpm** (use pnpm, not npm/yarn).
- Node: LTS (>= 20).

## Commands (client)

All from `client/`.

```
pnpm install       # install deps
pnpm dev           # dev server, http://localhost:3000
pnpm build         # production build
pnpm start         # serve production build
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit
```

## Commands (server)

All from `server/`.

```
pnpm install         # install deps
pnpm dev             # tsx watch, http://localhost:3001
pnpm build           # tsc
pnpm start           # node dist/index.js
pnpm lint            # eslint
pnpm typecheck       # tsc --noEmit
pnpm migrate         # supabase db push
pnpm seed            # tsx supabase/seed.ts
pnpm db:reset        # supabase db reset
```

## Directory layout

```
client/
  app/                  # Next.js App Router
    (store)/            # storefront routes — serves "/" via route group
    admin/              # admin routes at "/admin"
  components/
    ui/                 # shared primitives (wordmark, etc.)
    store/              # storefront-specific
    admin/              # admin-specific
  lib/
    api.ts              # fetch wrapper (get/post/patch)
    mappers.ts          # server-to-client data transformers
    data/               # mock data (fallback when API unavailable)
  public/

server/
  src/
    config/             # env.ts (grouped), supabase.ts (getAdminClient), http.ts (HTTPSTATUS)
    controllers/
      admin/            # 9 admin controllers (auth, categories, menu-items, deals, orders, locations, settings, jobs, dashboard)
      store/            # 3 store controllers (menu, store, actions)
    middleware/         # auth.ts, error-handler.ts, rate-limiter.ts, logger.ts, validate.ts, async-handler.ts
    routes/
      admin/            # 10 route files (auth, categories, menu, deals, orders, locations, settings, jobs, dashboard)
      actions.ts        # public POST /orders, POST /contact
      menu.ts           # public GET /menu/{full,categories,items,deals}
      store.ts          # public GET /store/{locations,settings,location}, PATCH /store/location
      index.ts          # mounts all routes
    services/           # admin.service, menu.service, order.service, store.service
    types/              # TypeScript types matching DB schema
    utils/              # app-error.ts (named exceptions), response.ts, async-handler.ts
    validators/         # Zod schemas
    index.ts            # express app bootstrap
  supabase/
    migrations/         # 001_initial_schema.sql (10 tables + RLS + indexes)
    seed.ts             # seed data
  .env.example
```

## Server architecture

Layered: `routes -> controllers -> services -> Supabase`

- **Routes** (`routes/`) — only schema validation + method delegation. No try/catch.
- **Controllers** (`controllers/`) — static methods, `(req, res) => void`, use `sendSuccess`/`sendError`.
- **Services** (`services/`) — throw named exceptions from `app-error.ts` (BadRequestException, NotFoundException, etc.).
- **Middleware** — `asyncHandler` wraps every controller; `errorHandler` catches named exceptions + Zod errors.
- **Types** (`types/`) — mirror DB columns; generated from schema.
- **Validators** (`validators/`) — Zod schemas; validate in route then pass `req.body` to controller.

### Key patterns

- `import { getAdminClient } from "../config/supabase.js"` — returns `createAdminClient()` from `@supabase/server/core`
- `import { envConfig } from "../config/env.js"` — grouped: `envConfig.SUPABASE`, `envConfig.JWT`, `envConfig.SERVER`, etc.
- `import { HTTPSTATUS } from "../config/http.js"` — status code constants
- `asyncHandler` wraps route handlers to forward thrown errors to `errorHandler`

## Brand system (client)

- **Background:** black (`#000000`)
- **Text:** white (`#FFFFFF`) and red (`#DC2626`) only
- Secondary text uses opacity (e.g. `text-white/70`)
- SVG wordmark in `components/ui/wordmark.tsx`

## Conventions

- TypeScript strict; no `any`.
- Server Components by default; `"use client"` only where interactivity required.
- Tailwind only — no CSS modules, no styled-components.
- Admin vs store: do not cross-import components.
- Do not hardcode colors/taglines — import from `lib/brand.ts` (client) or `config/http.ts` (server).
- No comments in code unless explaining a non-obvious decision.

## Environment

- `client/.env.local` — Next.js secrets (never commit).
- `server/.env` — Supabase + JWT config (never commit; copy from `.env.example`).
- Required vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `JWT_SECRET`.

## Gotchas

- Cart is client-side (Redux + localStorage) — no server-side cart yet.
- Storefront pages use `useEffect` + `api.ts` with mock-data fallback. If Express
  isn't running, pages render with `lib/data/*` mock data.
- Next.js rewrites proxy `/api/*` to `NEXT_PUBLIC_API_BASE_URL` (default
  `http://localhost:3001`). Copy `client/.env.local.example` to `.env.local`.
- Location cookie (`crispy_location_id`) is set by `PATCH /api/store/location`.
  No location selector UI exists in the checkout flow yet.
- Deals-section on homepage is promotional hero content (hardcoded) — not wired
  to the API deals endpoint.
- No `opencode.json` yet.
- Windows dev environment (PowerShell 5.1); use full cmdlet names in scripts.
