# AGENTS.md

## Project

Crispies — fast-food ordering website (burgers + chicken). Monorepo with two
app sides: an admin dashboard and a customer-facing storefront.

## Current state

- `client/` — Next.js app (App Router, TypeScript, Tailwind v4). Scaffolded, runs.
- `server/` — Node.js + Express API (NOT yet started; deferred). Do not scaffold or assume it exists.

Only the client side is being built right now. When the backend is added later,
keep it a separate package — do not couple client imports to server source.

## Stack

- Client: Next.js 16 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS v4.
- Server (future): Node.js + Express. Decide DB / ORM when server work starts.
- Package manager: **pnpm** (use pnpm, not npm/yarn, for all client commands).
- Node: use an LTS version (>= 20); install pnpm via `npm i -g pnpm` (corepack on Windows needs admin).

## Commands (client)

All client commands run from `client/`.

```
pnpm install       # install deps
pnpm dev           # dev server, http://localhost:3000
pnpm build         # production build
pnpm start         # serve production build
pnpm lint          # eslint (Next 16 removed `next lint`)
pnpm typecheck     # tsc --noEmit
```

Verification order before considering client work done: `lint -> typecheck -> build`.

## Directory layout (client)

```
client/
  app/
    (store)/              # storefront routes — owns "/" (route group, no URL segment)
      layout.tsx          # storefront chrome (header/nav)
      page.tsx            # "/" homepage
      menu/page.tsx       # "/menu" full menu grid
      cart/page.tsx       # "/cart" placeholder
    admin/                # admin routes at "/admin"
      layout.tsx          # admin chrome
      page.tsx            # "/admin" dashboard
      products/page.tsx   # "/admin/products"
      orders/page.tsx     # "/admin/orders"
    layout.tsx            # root layout (required, wraps all routes)
    globals.css
  components/
    ui/                   # generic primitives (shared by store + admin)
      wordmark.tsx        # SVG "CRISP-IES" wordmark + "P" monogram
    store/                # storefront-specific
      product-card.tsx    # product card with heat-level dots
    admin/                # admin-specific
  lib/
    brand.ts              # brand constants, palette, taglines
    products.ts           # mock product data (23 items across 5 categories)
    format.ts             # price formatter
  public/
```

There is intentionally NO `app/page.tsx`; the `(store)` route group serves `/`
so the storefront gets its own layout. Do NOT add a root `app/page.tsx` — it
would collide with `(store)/page.tsx` for the `/` route.

Route groups `(store)` and `admin/` keep the two surfaces isolated. Shared
components live in `components/ui`; surface-specific components never cross-import.

## Brand system

Brand identity is in `lib/brand.ts`. Do not hardcode colors/taglines in components
— import from brand constants.

**Color palette (strict):**
- **Primary background:** black (`#000000`) — use for all page/section backgrounds
- **Text colors:** white (`#FFFFFF`) and red (`#DC2626`) only — use white for body/primary text, red for accents, CTAs, and emphasis
- Do NOT use gray, cream, or other colors for text or backgrounds. Secondary text uses opacity on white (e.g., `text-white/70`) or black (`text-black/70`) on light surfaces

The SVG wordmark component (`components/ui/wordmark.tsx`) renders "CRISP-IES" with the red flag/drip accent; the monogram renders the "P" mark. Both are server components — add `"use client"` only if interactivity is needed.

Mock data lives in `lib/products.ts` (23 items across burgers, chicken, sides, shakes, drinks). Until the Express server exists, extend mock data here instead of inventing API routes. Heat levels are 1–5 and rendered as colored dots on product cards.

## Conventions

- TypeScript strict mode; no `any`.
- Server Components by default; add `"use client"` only where interactivity requires it.
- Styling: Tailwind only. No CSS modules, no styled-components.
- Data fetching: prefer Next.js `fetch` with caching options until the Express server exists; do not invent API base URLs that aren't configured.
- Admin vs store: do not import store components into admin routes or vice versa.

## Environment

- `.env.local` for client secrets (never commit).
- Required vars will be documented here as they are introduced. Do not hardcode API URLs.

## Gotchas

- Backend does not exist yet. Any feature needing a live API should be mocked in `lib/` until the server is up.
- Do not run or assume `server/` commands.
- Do not scaffold the Express server unless explicitly asked.
- Windows dev environment (PowerShell 5.1); use full cmdlet names in scripts.

## OpenCode config

- No `opencode.json` yet; add one if project-specific agent config is needed.