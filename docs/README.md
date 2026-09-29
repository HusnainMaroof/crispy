# Crispies — Project Guide

Everything about this project in one place: what it is, how it was built stage by stage, how the system works, every API endpoint, and the visual design.

## Contents

1. [Start here](#start-here) — the project in plain words
2. [How it was built, stage by stage](#how-it-was-built-stage-by-stage)
3. [Architecture](#architecture) — apps, flows, auth, database
4. [API](#api) — every endpoint
5. [Frontend design](#frontend-design) — colour, type, pages, motion

---

## Start here

**What it is.** Crispies is a London halal burger-and-chicken brand. This repo is its website:

- a **storefront** where customers pick a branch, browse that branch's menu, add to a cart, and check out
- an **admin dashboard** where staff manage orders, customers, staff, branches, the menu, and homepage content
- an **API** that sits between the two and is the only thing that talks to the database

**How the pieces connect.**

```
Customer / staff browser
        │
        ▼
Next.js app (client/)  ──fetch /api──►  Express API (server/)  ──Prisma──►  Neon Postgres
                                              │
                                              ├─ Cloudinary (image/video uploads)
                                              └─ Brevo (emails)
```

**The ideas that matter most.**

| Idea | In one sentence |
|---|---|
| Branch | Each of the nine stores is a row in `locations`. Menus, prices, orders, and managers all hang off it |
| Global menu + branch overrides | Products are defined once. Each branch says which ones it sells and can override the price |
| Cart | Lives only in the browser. One branch per cart. Its prices are for display only |
| Server pricing | At quote and checkout the server looks up every price itself and ignores what the browser sent |
| Order snapshot | An order line copies the name and price at checkout, so later menu edits never change old orders |
| Guest customers | No customer logins. A browser cookie identifies the guest and their orders |
| Staff roles | `superadmin` sees every branch. `branch_manager` and `staff` see only assigned branches and allowed areas |
| Homepage CMS | Homepage copy, images, video, and Instagram reels are edited in admin, in English or Arabic |
| Fixed design | The storefront look is fixed. New data is fed into the existing components, never a redesign |

**What is not real yet.** The menu is development mock data (fictional prices, stock photos). Payment is only a "card/cash" label. Delivery fees are not added. Brevo emails currently fail with an invalid key. Details are in [Known gaps](#known-gaps).

**Where to look in the code.**

| You want to… | Look in |
|---|---|
| Change a storefront section | `client/app/components/store/` |
| Change an admin screen | `client/app/super-admin/` and `client/lib/admin/` |
| Change cart or branch behaviour | `client/lib/redux/slices/cartSlice.ts`, `client/lib/cart-model.ts`, `client/lib/branch-selection.tsx` |
| Add or change an endpoint | `server/src/routes/` → `controllers/` → `services/`, with Zod in `validators/` |
| Change the database | `server/prisma/schema.prisma` plus a new folder in `server/prisma/migrations/` |
| Check behaviour is still correct | `server/tests/` (`pnpm test` in `server/`) |

---

## How it was built, stage by stage

The project started as a good-looking storefront with hardcoded content and a half-connected API on Supabase. It was moved to Express + Prisma + Neon, then rebuilt in stages. Each stage kept everything earlier stages had promised.

### Stage 1 — Audit of what actually existed

Recorded what the code really did, not what old notes claimed.

- The storefront did not call the API at all. The menu was a hardcoded `MOCK_ITEMS` array; branches were hardcoded in components.
- The cart saved `{ id, name, price, quantity }` to `localStorage`, but nothing displayed it and there was no checkout.
- `POST /api/orders` existed but trusted whatever prices the browser sent.
- Any admin could see and change any order. There was no manager role.
- Old docs describing Supabase, Postgres enums, and `get_dashboard_stats()` were already out of date.
- It fixed a list of **rules that must never break** (see [Rules that must keep holding](#rules-that-must-keep-holding)), and declared the storefront design fixed.

### Stage 2 — Domain and database design (no code)

Decided how branches, menus, customers, and staff should be modelled.

- One brand, so no organization table.
- `locations` **is** the branch; no second `branches` table.
- Products stay global; a join table (`branch_menu_items`) gives each branch its own availability and optional price. Same for deals (`branch_deals`).
- Order lines stay snapshots that are never rewritten.
- Managers get a join table (`admin_branch_access`) so one person can cover several branches.
- The cart would gain a single branch id; switching branch clears it.
- Also proposed (but never built): lead-tracking columns, an activity timeline, a translations table for menu text, a redirects table, and a franchise-pack download.

### Stage 3 — Connect the storefront to the API

The menu, location list, locations page, delivery page, and delivery overlay stopped using hardcoded arrays and started reading `GET /api/menu/full` and `GET /api/store/locations`, without changing how they look.

### Stage 4 — Branch foundation

- New Prisma migration history: the existing database was marked as a **baseline**, then the first real migration was applied. `prisma db push` is never used.
- `locations` gained `slug`, `postcode`, `city`, `status`, delivery/collection flags, and nullable fee overrides.
- Created `branch_menu_items`, `branch_deals`, and `admin_branch_access`.
- `orders.location_id` was confirmed as `ON DELETE SET NULL`, so deleting a branch never deletes orders.
- New admin endpoints to read and save a branch's menu and deals.

### Stage 5 — The nine real branches and branch menus

- The nine Crispies branches were inserted: Harrow Road, Tower Hill, Kilburn, Harrow, Elephant & Castle, Edgware Road, Stockwell, Wembley Central, Ruislip. The last two show "Coming Soon".
- `GET /api/menu/full` became branch-aware: with a branch (query or cookie) it returns only that branch's available items at the branch price; without one it returns the global menu.
- Picking a branch anywhere on the storefront now calls `PATCH /api/store/location`, which sets the `crispy_location_id` cookie.
- Branch managers became limited to their assigned branches.

### Stage 6 — Development mock catalogue

- `pnpm seed:catalogue` loads 10 categories, 38 products, and 6 deals, plus branch rows for all nine branches (342 menu rows, 54 deal rows), with deliberate differences (e.g. Tower Hill has no Grill, Harrow Road charges £9.25 for the Crispy Chicken Burger).
- New admin screen `/admin/branch-menu` to set price overrides and availability per branch.

### Stage 7 — Branch selection and a real cart

- The cart became `{ locationId, items: [{ id, kind, name, price, quantity }] }`. `kind` is `product` or `deal`.
- A cart panel appeared, with quantity, remove, and clear.
- Switching to a different branch with items in the cart asks whether to keep the branch or clear the cart.
- `GET /api/menu/deals` became branch-aware like the menu.

### Stage 8 — Server quote

- New `POST /api/menu/quote`: the browser sends only `{ kind, id, quantity }` and the server returns the real prices.
- Unavailable items return `ERR_ITEM_UNAVAILABLE` with the offending line, so the cart can point at it.
- A request that sends `price: 0.01` still gets the real price.

### Stage 9 — Checkout

- `POST /api/orders` now re-prices everything at submit time and writes the order and its lines in one transaction. Client prices are ignored.
- `checkout_key` makes checkout safe to retry: repeating the same key returns the original order.
- Deals can be order lines (`order_items.kind = "deal"`, `deal_id`).
- New `/checkout` page with review, collection or delivery, contact details, and confirmation.

### Stage 10 — Order management for staff

- A fixed status workflow: collection goes `pending → preparing → ready → delivered`, delivery adds `out-for-delivery` before `delivered`. Cancelling is allowed only before dispatch.
- The server returns `allowed_statuses` with every order; illegal moves are rejected; two simultaneous updates can't both win (409).
- Orders are scoped to the staff member's branches.
- New `/admin/orders/[id]` detail page.
- Customers can open only their own orders (`/orders/[id]`); email lookup no longer leaks other people's orders.

### Stage 11 — Guest customers and CRM

- New `customers` table whose `id` **is** the `crispy_customer_id` cookie. The first order creates it.
- Customers can view and edit their details and order history at `/orders`.
- New admin Customers screens with search, scoped by branch: a manager sees a customer only through orders at their branches.
- Two browsers are two customers, even with the same email. Nothing is merged.

### Stage 12 — Staff accounts and branch operations

- Staff can be active or inactive. Every request re-checks the account, so a deactivated person's old token stops working immediately, and the role from the database (not the token) is used.
- New Staff screens: create admins and managers, assign branches, activate/deactivate. Admins cannot create or edit superadmins.
- New Branches screens. "Deleting" a branch now marks it inactive instead, so orders keep their branch.

### Stage 13 — Homepage CMS

- New `homepage_sections` table for hero, welcome, flavours, and partner, seeded with the existing copy so nothing changed visually.
- `GET /api/store/homepage` returns only published sections; missing sections fall back to built-in copy.
- New admin editor with active/published toggles, ordering, and Cloudinary image upload. HTML and unsafe links are rejected. Branch managers cannot edit.

### Stage 14 — English and Arabic

- Section copy moved into `homepage_section_translations`, one row per language.
- Language is chosen by `?locale=`, then the `crispy_locale` cookie, then the browser language, then English. Missing Arabic falls back to English.
- Navbar, cart, checkout, and order pages read a UI dictionary. Money always shows as GBP.

### After Stage 14 — Richer homepage CMS

- Three more editable sections: `instagram` (profile and reels), `locations` (heading, card count, or a single redirect link), and `ordering` (use the cart, or send customers to an external ordering site).
- A `content` JSON field for section extras: hero video, flavour labels and icons, heat scale, image gallery, reels.
- Hero video uploads up to 50 MB through `POST /api/admin/upload-media`.
- The editor moved to `/admin/cms/homepage`, `/admin/cms/flavours`, and `/admin/cms/partner`.
- The public branch list now hides inactive branches.

### CMS pages, phase 1 — Page-based CMS foundation

- One registry (`server/src/config/cms-registry.ts`) defines every CMS page, its sections, and each section's fields. The server builds validation from it and the admin editor draws its forms from it.
- `homepage_sections` became `cms_sections` (`page`, `key`); translations became `cms_section_translations` with everything in `content`. Existing copy was carried over.
- Pages so far: `site` (ordering mode), `navbar` (logo, links, order buttons, language switch, social icons), and `home`. Footer, menu, franchise, locations, delivery, checkout, orders, and SEO come in later phases.
- Only a superadmin can edit content. Admins and branch managers get 403 and do not see the Content menu.
- Hiding a section is done with "Show this section". Unpublished copy is a draft: visitors see the published English copy, or the built-in default.
- Homepage sections after hero and welcome follow the saved order.
- The old `/api/admin/content/homepage` routes were removed.

---
## Architecture

Crispies is a London halal burger-and-chicken brand. This repo holds its public storefront, its staff admin, and the API behind both.

This file describes the system as it runs today. The API reference is in [API](#api). The visual system is in [Frontend design](#frontend-design).

```
Browser
  │
  ├─ Storefront and admin UI     Next.js 16 App Router   (client/)
  │     fetch /api/...
  │
  └─ API                         Express 4               (server/)
        │
        ├─ Prisma 7 → Neon Postgres
        ├─ Cloudinary            image and video uploads
        └─ Brevo                 order and status emails
```

The Next app never opens a database connection. Every read and write goes through Express. There is no Supabase anywhere in the running system; older notes that mention Supabase Auth, service-role keys, RLS, Postgres enums, or `get_dashboard_stats()` are out of date.

---

### Apps, ports, and environment

| App | Path | Role | Default port |
|---|---|---|---|
| Client | `client/` | Storefront at `/`, admin at `/admin` | 3000 |
| Server | `server/` | REST API under `/api`, health at `/health` | `PORT` or 4000 |

`client/next.config.ts` rewrites public `/api/:path*` requests to `NEXT_PUBLIC_API_BASE_URL`, falling back to `http://localhost:4000`. Admin API requests use a same-origin Next route handler at `app/api/admin/[...path]/route.ts`, which forwards request cookies and upstream `Set-Cookie` headers so HttpOnly admin sessions work across deployments. Set `NEXT_PUBLIC_API_BASE_URL` to the Express API origin in production.

**Client** (`client/.env`): `NEXT_PUBLIC_API_BASE_URL`.

**Server** (`server/.env`, see `server/.env.example`):

| Variable | Required | Use |
|---|---|---|
| `NEON_DATABASE_URL` | Yes | Pooled Neon connection, used by the app |
| `NEON_DIRECT_URL` | No | Direct connection for Prisma migrations. Falls back to the pooled URL |
| `JWT_SECRET` | Yes | Signs staff JWTs |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `PORT` | No | Default `4000` |
| `NODE_ENV` | No | `development`, `production`, `test` |
| `CORS_ORIGIN` | No | Default `*`. Development always allows any origin |
| `RATE_LIMIT_MAX` | No | Default 100 per 15 minutes |
| `BREVO_SMTP_SDK_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Yes | Transactional email |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | Uploads |
| `LOG_LEVEL` | No | Pino, default `info` |

#### Commands

```
# client/
pnpm dev | build | start | lint | typecheck
node --experimental-strip-types --test lib/cart-model.test.ts lib/i18n/i18n.test.ts

# server/
pnpm dev              nodemon + tsx
pnpm build            tsc, then scripts/fix-dist-imports.mjs
pnpm start            node dist/index.js
pnpm lint | typecheck
pnpm test             tsx --test tests/**/*.test.ts (hits the configured database)
pnpm migrate          prisma migrate deploy
pnpm prisma:generate
pnpm seed             empty-database seed: settings, nine branches, branch lines (plain inserts)
pnpm seed:catalogue   development mock catalogue (upsert, never deletes)
pnpm db:ping          Neon connectivity check
```

Never run `prisma db push` or `prisma migrate reset` against the live database. Schema changes go through a new migration folder and `pnpm migrate`.

---

### Client

**Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, Redux Toolkit, GSAP, Lenis, Leaflet, react-hot-toast.

#### Routes

The homepage (`app/page.tsx`) is a server component outside the `(store)` group. It renders its own navbar, fetches `GET /api/store/cms/home` with `cache: "no-store"`, and falls back to built-in copy if that call fails.

Pages under `app/(store)/` share `layout.tsx`: Lenis smooth scroll, a toast host, and the store navbar.

| URL | What it is |
|---|---|
| `/` | Homepage: hero, welcome, flavours, locations, partner, Instagram, footer |
| `/menu` | Menu from `GET /api/menu/full` and `/api/menu/deals`, add to cart |
| `/locations` | Branch list, search, and map |
| `/delivery` | Branch picker for delivery, or an external redirect when the CMS says so |
| `/franchise-inquiries` | Franchise form |
| `/checkout` | Server-quoted cart review and order form, then confirmation |
| `/orders` | Guest profile and order history for this browser |
| `/orders/[id]` | One order, only for the browser that placed it |

| Admin URL | What it is |
|---|---|
| `/super-admin/login` | Shared sign-in, no shell |
| `/super-admin` | Company dashboard |
| `/super-admin/orders`, `/super-admin/customers` | Ordering, with Orders and Customers views |
| `/super-admin/staff`, `/super-admin/staff/[id]` | Team, positions, branch assignments, and access |
| `/super-admin/locations` | Branch editor |
| `/super-admin/menu` | Shared catalogue and branch menus |
| `/super-admin/posts` | Job posts and applications |
| `/super-admin/cms/[page]` | Content editor, super admin only |
| `/super-admin/settings` | Saved delivery values |
| `/{branch}/admin/...` | Branch manager view of assigned operational tabs |
| `/{branch}/{person}/...` | Staff view of assigned operational tabs |

`app/super-admin/layout.tsx` verifies the HttpOnly `crispy_admin_session` cookie against `/api/admin/auth/me`, shows a skeleton while checking, redirects guests to `/super-admin/login`, and sends signed-in visitors to the home path for their role. Branch and staff URLs reuse the same pages through Next middleware.

#### Data on the client

```
Page or hook
  → Redux thunk, admin hook, or branch-selection context
    → lib/api.ts   (HttpOnly cookie, one refresh + retry on 401, one retry on 429)
      → Express /api
```

| Piece | Holds |
|---|---|
| Redux `cart` | `{ locationId, items: [{ id, kind, name, price, quantity }] }`, persisted to `localStorage` key `crispies_cart` |
| Redux `menu` | Categories, items, deals for the selected branch |
| Redux `locations`, `settings` | Branch list and company settings |
| `lib/branch-selection.tsx` | Selected branch, cart panel, server quote, branch-switch dialog (`BranchChrome`) |
| `lib/admin/*` | Admin data hooks (`use-auth`, `use-orders`, `use-menu`, `use-locations`, …) |
| `lib/i18n/` | Locale context and UI dictionary |
| `lib/use-store-locations.ts`, `lib/use-store-ordering.ts` | Shared branch list and CMS ordering mode for storefront components |

Store and admin components never import each other. Shared primitives live in `app/components/ui/`.

#### Folder map

```
client/
  app/
    page.tsx              homepage (server component)
    layout.tsx            fonts, metadata, locale cookie, Providers
    globals.css           brand tokens and motion utilities
    (store)/              menu, locations, delivery, franchise, checkout, orders
    admin/                dashboard pages
    components/
      store/              storefront sections and pages
      admin/layout|ui/    shell, sidebar, modal, dropdown, stat card
      providers/          Lenis
      seo/                JSON-LD
      ui/                 optimized image, select
  lib/
    api.ts                fetch wrapper
    redux/                store and slices
    admin/                admin hooks
    i18n/                 locales and dictionary
    cart-model.ts         pure cart rules (tested)
    branch-selection.tsx  branch + cart chrome
    location-search.ts    postcodes.io and Nominatim lookup
  public/                 images, video, Korolev font files
```

---

### Server

**Stack:** Node (ESM), Express 4, TypeScript (strict), Prisma 7 with `@prisma/adapter-pg`, Zod, Pino, Helmet, CORS, compression, cookie-parser, express-rate-limit, multer, Cloudinary, Brevo, jsonwebtoken.

#### Request pipeline (`src/index.ts`)

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

#### Layers

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

| Service | Job |
|---|---|
| `menu.service.ts` | Global and branch menu, categories, items, deals |
| `branch-menu.service.ts` | Admin read/upsert of branch menu and deal lines |
| `quote.service.ts` | Server pricing for a cart |
| `order.service.ts` | Checkout, order reads, status workflow, dashboard stats, emails |
| `customer.service.ts` | Guest profiles and branch-scoped CRM |
| `staff.service.ts` | Staff CRUD, activation, branch assignment |
| `branch-access.service.ts` | Which branches a staff member may touch |
| `cms.service.ts` | Public CMS page payloads and CMS editing (superadmin only) |
| `store.service.ts`, `admin.service.ts` | Locations, settings, jobs, applications, contact |
| `email.service.ts`, `email-templates.ts` | Brevo send and HTML |
| `upload.service.ts` | Cloudinary image and video upload |

---

### Staff auth and roles

1. `POST /api/admin/auth/login` looks up `admin_profiles` by email and checks the scrypt hash (`salt:hash`).
2. Unknown email, wrong password, and inactive account all return the same 401.
3. The server signs a JWT (`sub`, `email`, `role`) with `JWT_SECRET`.
4. The server sends it in the HttpOnly, SameSite=Lax `crispy_admin_session` cookie; JavaScript cannot read the credential.
5. `middleware/auth.ts` verifies the cookie, then reloads the profile on every request. A missing or inactive profile is rejected, and the **database** role is used, not the one baked into the token.
6. `POST /api/admin/auth/refresh` re-signs a still-valid cookie session. `lib/api.ts` calls it once on a 401. Logout clears the cookie.

| Capability | Super admin | Branch manager | Staff member |
|---|---|---|---|
| Branches visible | All | Assigned branches | Assigned branches |
| Create, edit, deactivate branches | Yes | No | No |
| Branch menu and deals | All | Assigned branches | View assigned branch menu |
| Orders and customers | All | Assigned branches, if granted the area | Assigned branches, if granted the area |
| Manage team accounts | All | Staff in assigned branches only | No |
| Site content, jobs, settings, shared catalogue | Yes | No | No |
| Edit own name | Yes | Yes | Yes |

Only three account roles can be assigned: `superadmin`, `branch_manager`, and `staff`. Staff accounts have a job position such as Cashier or Kitchen staff; the position is descriptive, while tab permissions control access. The Team form uses branch and access selectors instead of a wall of checkboxes. Existing `admin` accounts become branch managers in the migration. Accounts with no branch assignment are deactivated until the super admin assigns a branch and reactivates them.

Branch lists are read at request time, so removing an assignment takes effect before the token expires.

---

### Customer identity and cookies

There are no customer accounts. A guest is identified by a cookie.

| Cookie | Set by | Lifetime | Use |
|---|---|---|---|
| `crispy_customer_id` | `identifyCustomer` when missing | 1 year (not refreshed) | Guest id. Equals `customers.id` and `orders.customer_id` |
| `crispy_location_id` | `PATCH /api/store/location` (active branch only) | 90 days | Selected branch for menu and deals |
| `crispy_locale` | Storefront language switcher | Client cookie | `en` or `ur` |

Server cookies are `httpOnly`, `sameSite=lax`, path `/`, and `secure` in production.

The first order (or a profile save) creates the `customers` row. Two browsers are two customers, even with the same email; nothing is merged.

---

### Ordering flow

```
Pick a branch (locations section, locations page, delivery page, or navbar overlay)
  → PATCH /api/store/location          sets crispy_location_id
  → GET /api/menu/full, /api/menu/deals  branch catalogue with effective prices
  → add to cart                         Redux + localStorage, one branch per cart
  → open cart → POST /api/menu/quote    server prices every line
  → /checkout → POST /api/orders        re-quotes, writes order + lines in one transaction
  → confirmation → /orders/[id]
  → staff move status in /admin/orders/[id]
```

#### Branch menu

`menu_items` and `deals` are the global brand catalogue. `branch_menu_items` and `branch_deals` say which of those a branch sells and at what price:

- No row: the branch does not sell it.
- `price` null: use the global price. A number overrides it.
- `available = false`: hidden at that branch only.

A menu request with no branch returns the global catalogue. With a branch it returns only available lines, with the effective price, and drops empty categories. There is no per-branch category table.

#### Cart

Client only, never stored on the server. One `locationId` for the whole cart. Lines are `{ id, kind: "product" | "deal", name, price, quantity }`; `price` is a display value only. Picking a different branch with items in the cart opens a dialog: keep the branch, or clear the cart and switch. An old cart saved as a plain array is read as products with no branch.

#### Quote and checkout

The server ignores every client price. For each line it loads the catalogue row and the branch row and requires: branch exists and is `active`, catalogue row `active`, branch row present and `available`. Unit price is the branch override or the global price. Money is summed with Prisma `Decimal` and rounded once.

Checkout re-runs the quote at submit time (an earlier quote is never reused), then writes `orders` and `order_items` in one transaction. `checkout_key` (a UUID kept in `sessionStorage` until success) is unique on `orders`, so a retried submit returns the original order. The cart is cleared only after success. Emails are attempted after commit; a send failure is logged and never rolls back the order.

Delivery requires address, postcode, and city. Collection stores no address. `payment_method` (`card` / `cash`) is a label only; nothing is charged.

#### Order snapshot

`order_items` stores `name`, `price`, `quantity`, and `kind`. Products set `menu_item_id`; deals set `deal_id`. Both links are `ON DELETE SET NULL`, so deleting or repricing a product never changes a past order. Line total is `price * quantity`; there is no stored line total.

#### Status workflow

The server is the only place that decides the next status. Every admin order payload includes `allowed_statuses`.

| Fulfilment | Path |
|---|---|
| Collection | `pending` → `preparing` → `ready` → `delivered` |
| Delivery | `pending` → `preparing` → `ready` → `out-for-delivery` → `delivered` |

`cancelled` is allowed from `pending`, `preparing`, and `ready`. `delivered` and `cancelled` are terminal. The write is `updateMany` on id + current status, so a lost race returns 409.

#### Emails (Brevo)

| Trigger | Recipient |
|---|---|
| Order created | Customer confirmation, plus a new-order notice to `ADMIN_EMAIL` |
| Status `cancelled` | Customer cancellation |
| Status `delivered` | Customer delivered |
| Any other status | Customer status update |

---

### CMS and locales

`server/src/config/cms-registry.ts` is the single definition of the CMS. Each page (`site`, `home`, …) lists its sections, and each section lists its fields. A field has a kind (`text`, `image`, `video`, `link`, `url`, `number`, `select`, `toggle`, `list`, where list items can be objects), limits, and a default equal to the storefront's built-in copy. `validators/cms.schema.ts` turns a section's fields into a strict Zod schema; the admin editor renders the same definitions.

`cms_sections` has one row per `(page, key)` with `sort_order` and `is_active`. Rows are created on first open of a page in the admin, so a new registry section needs no migration. Copy lives in `cms_section_translations`, unique on `(section_id, locale)`: `content` JSON and `is_published`.

The public read (`getPublicCmsPage`) skips inactive sections. For the rest it takes the published copy in the requested locale, else published English, else nothing, and lays that over the registry defaults, so every field is always present. Pinned sections (homepage hero and welcome) always come first; on sortable pages the rest follow `sort_order`. `site.ordering.mode = "redirect"` sends order buttons and `/delivery` to an external `https://` URL instead of the cart.

Supported locales are `en` (default) and `ur`, resolved by `?locale=`, then `crispy_locale`, then `Accept-Language`, then `en`. UI strings come from a dictionary that falls back to English. Addresses, names, prices, and order snapshots are never translated. Money is always GBP formatted as `en-GB`. There are no `/en` or `/ur` URL prefixes.

---

### Database

Postgres on Neon, accessed only through Prisma (`server/prisma/schema.prisma`). Status, role, fulfilment, and payment columns are text, not Postgres enums. Money is `numeric(10,2)`. Low-volume rows use text ids; orders, order lines, branch lines, contact messages, and settings use `bigint` identity.

| Table | Purpose |
|---|---|
| `menu_categories` | Brand categories |
| `menu_items` | Products. Global price, `active` flag |
| `deals` | Promotions. Global price, `active` flag |
| `locations` | The branch: address, postcode, city, hours, phone, lat/lng, slug, `status` (`active` / `inactive`), delivery/collection flags, optional fee overrides |
| `branch_menu_items` | Product membership, price override, availability per branch. Unique `(location_id, menu_item_id)` |
| `branch_deals` | Same for deals. Unique `(location_id, deal_id)` |
| `orders` | One checkout. `location_id`, `customer_id`, `checkout_key` (unique), totals, status |
| `order_items` | Line snapshot: `kind`, `name`, `price`, `quantity`, optional `menu_item_id` / `deal_id` |
| `customers` | Guest profile. `id` is the `crispy_customer_id` cookie |
| `admin_profiles` | Staff: email, name, `role`, scrypt `password_hash`, `is_active` |
| `admin_branch_access` | Manager ↔ branch. Primary key `(admin_id, location_id)` |
| `business_settings` | Singleton (`id = 1`): `delivery_fee`, `free_delivery_threshold` |
| `cms_sections`, `cms_section_translations` | Page-based CMS |
| `job_posts`, `job_applications` | Careers |
| `contact_messages` | Contact and franchise enquiries |
| `homepage_content` | Legacy key → JSON table. Unused |

#### Delete rules

| From | To | On delete |
|---|---|---|
| `menu_items.category_id` | `menu_categories` | Cascade |
| `orders.location_id` | `locations` | Set null |
| `orders.customer_id` | `customers` | Set null |
| `order_items.order_id` | `orders` | Cascade |
| `order_items.menu_item_id` / `deal_id` | `menu_items` / `deals` | Set null |
| `branch_menu_items`, `branch_deals`, `admin_branch_access` | parent rows | Cascade |
| `job_applications.job_post_id` | `job_posts` | Cascade |
| `cms_section_translations.section_id` | `cms_sections` | Cascade |

Branch "delete" in the admin sets `status = inactive` instead, so orders keep their branch.

#### Migrations (`server/prisma/migrations/`)

| Folder | Change |
|---|---|
| `20260927110000_baseline` | Existing schema, marked applied, not re-run |
| `20260927120000_branch_foundation` | Branch columns on `locations`, `branch_menu_items`, `branch_deals`, `admin_branch_access` |
| `20260927140000_crispies_branches` | The nine real branches |
| `20260927150000_order_checkout` | `orders.checkout_key`, `order_items.kind`, `order_items.deal_id` |
| `20260927160000_customers` | `customers`, backfilled from existing orders, FK from orders |
| `20260927170000_staff_active` | `admin_profiles.is_active`, `updated_at` |
| `20260927180000_homepage_sections` | Homepage CMS table, seeded with current copy |
| `20260927190000_homepage_translations` | Copy moved to per-locale translation rows |
| `20260927200000_homepage_cms_media` | `content` JSON, Instagram/locations/ordering sections |
| `20260928090000_cms_pages` | Tables renamed to `cms_sections` / `cms_section_translations`, `page` column, copy folded into `content`, ordering moved to `site` |

#### Seed data

The nine branches: Harrow Road, Tower Hill, Kilburn, Harrow, Elephant & Castle, Edgware Road, Stockwell, Wembley Central, Ruislip. Wembley Central and Ruislip are `active` with hours `Coming Soon`, which the storefront shows as closed.

`pnpm seed:catalogue` loads a **development mock catalogue** (10 categories, 38 products, 6 deals, Unsplash photos, fictional prices) and branch rows for every branch, with a few deliberate differences for testing. It is not the real Crispies menu.

---

### Rules that must keep holding

- The browser never talks to Postgres. Express is the only database client.
- Response envelopes stay compatible with `client/lib/api.ts`.
- The server prices every order line. Client prices are never stored.
- Order lines are snapshots and are never rewritten by catalogue edits.
- `orders.location_id`, `order_items.menu_item_id`, and `order_items.deal_id` stay nullable with `ON DELETE SET NULL`.
- The cart stays client-only under `crispies_cart`, with one branch per cart.
- A guest only ever sees orders tied to their own `crispy_customer_id`.
- Branch managers only see their assigned branches. `admin` and `superadmin` need no access rows.
- New orders start as `pending`. Status changes follow the transition table and email the customer. Email failure never rolls back a write.
- Dashboard stats stay `total_orders`, `active_orders` (not `delivered` or `cancelled`), `revenue`, and `today_revenue` (since 00:00 UTC). Revenue includes cancelled orders.
- The storefront design is fixed. New data is fed into the existing components rather than redesigning them.

#### Design decisions worth knowing

- **One brand, no organization table.** A second brand would need a real tenant migration.
- **`locations` is the branch.** There is no separate `branches` table; the admin and API still say "location".
- **Categories stay global.** A branch shows a category when it has an available item in it.
- **Deals are separate from products.** They become order lines through `order_items.kind = "deal"` and `deal_id`.
- **Branch fee overrides** are nullable columns on `locations`; null means use `business_settings`.
- **No modifiers, no server cart, no Instagram post table.** Instagram reels are CMS JSON pointing at real Instagram URLs.

---

### Known gaps

- Delivery fee and the free-delivery threshold are not applied. `delivery_fee` is 0 and `total` equals the food subtotal.
- No payment processing. Card and cash are labels.
- Brevo sends currently fail with `401 Key not found`; orders and status changes still save.
- `GET /api/admin/dashboard/stats` is not branch-scoped, so a branch manager sees company totals.
- Login for an unknown email returns slightly faster than a wrong password (same message).
- Catalogue rows without Arabic names (`name_ar`, `title_ar`) show their English names in the Arabic store.
- Full `pnpm lint` on the server fails on the `namespace` declaration in `identify-customer.ts`.
- No browser end-to-end tests. Server rules are covered by `server/tests/`.
- Not built from the earlier design: lead status/assignment columns on `contact_messages`, an activity timeline, a `translations` table for catalogue text, a `redirects` table, and a franchise-pack download.

---

## API

Express server, base path `/api`. System design is in [Architecture](#architecture).

The Next app rewrites `/api/:path*` to `NEXT_PUBLIC_API_BASE_URL` (fallback `http://localhost:4000`). `client/lib/api.ts` calls `${NEXT_PUBLIC_API_BASE_URL}/api...` with `credentials: "include"` so cookies are sent.

Health is not under `/api`:

`GET /health` → `{ "status": "ok", "timestamp": "<ISO>" }`

Admin routes authenticate with the HttpOnly `crispy_admin_session` cookie. `POST /api/admin/auth/login` sets it; `POST /api/admin/auth/logout` clears it.

---

### Conventions

#### Envelopes

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

#### Rate limits

Window is 15 minutes. `RATE_LIMIT_MAX` defaults to 100.

| Limiter | Applies to | Max |
|---|---|---|
| Global | Everything except `/api/admin` and `/health` | `RATE_LIMIT_MAX` |
| Auth | `/api/admin/auth` | 10 failed requests (successes not counted) |
| Admin | `/api/admin` | `RATE_LIMIT_MAX` |

#### Cookies

| Cookie | Set by | Lifetime | Use |
|---|---|---|---|
| `crispy_customer_id` | Every request that arrives without it | 1 year | Guest identity. Copied onto orders |
| `crispy_location_id` | `PATCH /api/store/location` | 90 days | Selected branch for menu and deals |
| `crispy_locale` | Storefront language switcher | — | `en` or `ur` for homepage copy |

Server cookies are `httpOnly`, `sameSite=lax`, path `/`, `secure` in production.

#### Branch scope for staff

`superadmin` sees every branch. `branch_manager` and `staff` see only branches in `admin_branch_access`. Where a route is branch-scoped, another branch returns 403, and list routes return only assigned branches.

---

### Public — Menu

#### `GET /api/menu/full`

Categories ordered by `sort_order`, each with nested items.

| Branch source | Result |
|---|---|
| None | Global catalogue: active items at `menu_items.price` |
| `?location_id=<id>` | That branch only. Unknown or inactive id → 404 |
| `crispy_location_id` cookie (no query) | That branch. A stale cookie falls back to the global menu |

For a branch, an item appears only when it is active and has an available `branch_menu_items` row. `price` is the branch override when set, otherwise the global price. Categories with no remaining items are omitted.

```json
[
  {
    "id": "mock-cat-gourmet",
    "number": "02",
    "title": "Gourmet Burgers",
    "image": "https://...",
    "sort_order": 1,
    "items": [
      { "id": "mock-burger-crispy", "category_id": "mock-cat-gourmet", "name": "Crispy Chicken Burger", "description": "...", "price": 9.25, "image": "https://...", "badge": null, "badge_variant": null, "sort_order": 0, "active": true }
    ]
  }
]
```

#### `GET /api/menu/categories`

Flat global category list.

#### `GET /api/menu/items`

Active global items. Optional `?category_id=`.

#### `GET /api/menu/deals`

Active deals. Same branch rules as `/menu/full` (query, then cookie, then global).

#### `POST /api/menu/quote`

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

### Public — Store

#### `GET /api/store/locations`

Active branches only.

```json
[
  {
    "id": "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001",
    "name": "Harrow Road",
    "slug": "harrow-road",
    "address": "412 Harrow Road, London W9 2HU",
    "postcode": "W9 2HU",
    "city": "London",
    "hours": "11:00 AM – 11:00 PM",
    "phone": "",
    "lat": 51.523411,
    "lng": -0.196294,
    "status": "active",
    "delivery_enabled": true,
    "collection_enabled": true,
    "delivery_fee": null,
    "free_delivery_threshold": null,
    "sort_order": 0
  }
]
```

`hours: "Coming Soon"` is how the storefront marks a branch as not yet open.

#### `GET /api/store/locations/:id`

One location. 404 if missing.

#### `GET /api/store/location`

The branch in `crispy_location_id`, or `null` if the cookie is missing, stale, or points at an inactive branch.

#### `PATCH /api/store/location`

```json
{ "location_id": "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001" }
```

Sets the cookie and returns the location. 404 if the branch is missing or inactive.

#### `GET /api/store/settings`

```json
{ "id": 1, "delivery_fee": 2.99, "free_delivery_threshold": 20, "updated_at": "..." }
```

#### `GET /api/store/cms/:page`

Published content for one CMS page (`site`, `home`, …). Unknown page → 404. Locale: `?locale=`, then `crispy_locale`, then `Accept-Language`, then `en`. An invalid value becomes `en`. `GET /api/store/homepage` is an alias for `/api/store/cms/home`.

Inactive sections are left out of `order` and `sections`. Every other section is present with every field: published copy in the requested locale, else published English, laid over the registry defaults.

```json
{
  "page": "home",
  "locale": "en",
  "order": ["hero", "welcome", "flavours", "locations", "partner", "instagram"],
  "sections": {
    "hero": { "lines": ["Always Good", "Mood Food"], "videoUrl": "/images/herobgvideo.mp4" },
    "welcome": { "description": "..." },
    "flavours": {
      "title": "Crispies Original Flavours",
      "discoverTitle": "Discover Your Crispy Flavor",
      "flavours": [{ "label": "Zesty Lemon", "image": "" }],
      "scaleTitle": "Flaming Grill Flavour",
      "scale": [{ "label": "Garlic", "image": "" }],
      "galleryImages": ["/images/aboutimage.jpg"],
      "ctaLabel": "Order On The Website",
      "ctaUrl": "/menu"
    },
    "locations": { "title": "Find Your Nearest Crispies", "displayMode": "cards", "cardLimit": 5, "ctaLabel": "View All 10+ Locations", "ctaUrl": "/locations" },
    "partner": { "title": "Bring Crispies\nto your city.", "description": "...", "ctaLabel": "Become A Partner", "ctaUrl": "/franchise-inquiries", "imageUrl": "" },
    "instagram": { "title": "Instagram", "username": "crispiesuk", "profileUrl": "https://www.instagram.com/crispiesuk", "posts": "557", "followers": "16.1k", "following": "19", "bio": "...", "followLabel": "Follow", "reels": [{ "url": "https://www.instagram.com/reel/...", "thumbnailUrl": "/images/heroimage.png", "likes": "", "views": "" }] }
  }
}
```

`GET /api/store/cms/site` returns `sections.ordering`: `{ "mode": "cart" | "redirect", "redirectUrl": "", "ctaLabel": "Order Now" }`. `mode = "redirect"` tells the storefront to send order buttons to `redirectUrl` (always `https://`).

#### `GET /api/store/jobs`

Job posts with `status: "active"`.

#### `GET /api/store/jobs/:id`

One active job. 404 if missing or not active.

---

### Public — Orders and customers

#### `POST /api/orders`

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

#### `GET /api/orders/mine`

Orders for the current `crispy_customer_id`, newest first. Empty array if none.

#### `POST /api/orders/lookup`

```json
{ "email": "jane@example.com" }
```

Orders with that email **that also belong to this cookie**. It does not reveal other browsers' orders.

#### `GET /api/orders/:id`

```json
{ "order": {}, "items": [] }
```

Returned only when the order's `customer_id` equals the caller's cookie. Otherwise 404.

#### `GET /api/customers/me`

The guest profile for this cookie (`id`, `name`, `email`, `phone`), or an empty profile if none exists yet.

#### `PATCH /api/customers/me`

Body: any of `name`, `email`, `phone` (at least one). A `customer_id` field is stripped. Writes only the caller's own row.

#### `POST /api/contact`

```json
{ "name": "Jane Doe", "email": "jane@example.com", "subject": "Franchise", "message": "I want to open a store.", "type": "franchise" }
```

`type`: `general` | `franchise` | `careers` | `press`. `201` returns the stored message.

#### `POST /api/jobs/:id/apply`

The job id is the URL param. Increments `job_posts.applications`.

```json
{ "applicant_name": "Jane Doe", "email": "jane@example.com", "phone": "+44 7123 456789", "cv_url": "https://...", "cover_letter": "..." }
```

`phone`, `cv_url`, `cover_letter` optional. `201` returns the application.

---

### Admin — Auth

#### `POST /api/admin/auth/login`

```json
{ "email": "admin@crispies.com", "password": "at-least-8-chars" }
```

```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "superadmin", "is_active": true, "created_at": "..." }
}
```

Unknown email, wrong password, and inactive account all return 401 `Invalid email or password`. `password_hash` is never returned.

#### `POST /api/admin/auth/refresh`

Needs a still-valid `crispy_admin_session` cookie for an active account. Rotates the cookie and returns the current user profile.

#### `GET /api/admin/auth/me`

Current staff profile.

#### `PATCH /api/admin/auth/me`

`{ "name": "New Name" }`. Any role may change their own name. Role cannot be changed here.

---

### Admin — Upload

| Method | Path | Max size | Types |
|---|---|---|---|
| POST | `/api/admin/upload` | 5 MB | JPEG, PNG, WebP, AVIF, MP4, WebM, QuickTime |
| POST | `/api/admin/upload-media` | 50 MB | Same |

`multipart/form-data`, field name `file`. Files are stored in Cloudinary; nothing binary goes into Postgres.

`201`: `{ "url": "https://res.cloudinary.com/...", "publicId": "..." }`

No file or a rejected type → 400. Too large → 413.

---

### Admin — Catalogue

Global brand catalogue. Any authenticated staff role. Ids are generated by the server.

#### Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/categories` | List |
| GET | `/api/admin/categories/:id` | 404 if missing |
| POST | `/api/admin/categories` | `number` (≤4 chars), `title`, `image` (URL), optional `sort_order` |
| PUT | `/api/admin/categories/:id` | Partial |
| DELETE | `/api/admin/categories/:id` | Cascades to its items |

#### Menu items

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/menu` | Includes inactive. `?category_id=` |
| GET | `/api/admin/menu/:id` | |
| POST | `/api/admin/menu` | See body below |
| PUT | `/api/admin/menu/:id` | Partial |
| DELETE | `/api/admin/menu/:id` | Order lines keep their snapshot; `menu_item_id` becomes null. Branch lines are removed |

```json
{
  "category_id": "mock-cat-wings",
  "name": "5 Wings",
  "description": "Five crispy golden wings.",
  "price": 5.99,
  "image": "https://...",
  "badge": null,
  "badge_variant": null,
  "sort_order": 0,
  "active": true
}
```

`badge_variant`: `default` | `vegan` | null.

#### Deals

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/deals` | Includes inactive |
| GET | `/api/admin/deals/:id` | |
| POST | `/api/admin/deals` | `name`, `description`, `price`, `image`, optional `badge`, `badge_variant`, `active` |
| PUT | `/api/admin/deals/:id` | Partial |
| PATCH | `/api/admin/deals/:id/toggle` | Flips `active` |
| DELETE | `/api/admin/deals/:id` | Order lines keep their snapshot; `deal_id` becomes null |

---

### Admin — Locations (branches)

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

### Admin — Orders

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

### Admin — Customers

Branch-scoped through orders: a manager sees a customer only if they have an order at an assigned branch, and only those orders.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/customers` | Optional `?q=` (case-insensitive contains on name, email, phone). Rows include order count, latest in-scope order, created date |
| GET | `/api/admin/customers/:id` | Profile plus in-scope orders. 404 when out of scope |

---

### Admin — Staff

Super admins manage branch managers and staff. Branch managers manage staff assigned to their own branches. Staff members cannot access Team.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/staff` | Name, email, role, position, `is_active`, assigned branch names |
| GET | `/api/admin/staff/:id` | |
| POST | `/api/admin/staff` | See body below |
| PATCH | `/api/admin/staff/:id` | Any of `name`, `email`, `password`, `role`, `position`, `tabs`, `branchIds`, `is_active` |
| POST | `/api/admin/staff/:id/deactivate` | Keeps the row and assignments. You cannot deactivate yourself |
| POST | `/api/admin/staff/:id/activate` | |
| PUT | `/api/admin/staff/:id/branches` | `{ "branchIds": ["..."] }` replaces assignments |

```json
{ "name": "Sam", "email": "sam@crispies.co.uk", "password": "at-least-8-chars", "role": "branch_manager", "branchIds": ["6f8c2a14-0b31-4d5e-9a72-11c0ffee0001"] }
```

`role`: `superadmin` | `branch_manager` | `staff`. Branch managers and staff need at least one real branch. Branch managers can only add staff within their assigned branches and grant access they hold themselves. Up to 20 branch ids.

---

### Admin — CMS

`/api/admin/cms`. Superadmin only; admins and branch managers get 403.

| Method | Path | Notes |
|---|---|---|
| GET | `/pages` | Every CMS page: `id`, `label`, `detail`, `path`, `sortable`, `sectionCount` |
| GET | `/pages/:page` | `?locale=en|ur`. Creates any missing section rows, then returns each section with its field `definition`, the `content` to edit (that locale's copy, else English, else defaults), `translation` (`is_published`, `updated_at`) or null, `copied_from_english`, and `coverage` per locale |
| PATCH | `/sections/:id` | `{ locale?, content?, is_active?, is_published? }`. Upserts that locale's copy. Returns the page |
| POST | `/sections/:id/move` | `{ "direction": "up" | "down" }`. Only on sortable pages and unpinned sections, else 400. Returns the page |
| POST | `/sections/:id/reset` | `{ "locale": "en" | "ar" }`. Deletes that locale's copy, so English or the default shows. Returns the page |

`content` is checked against the section's registry fields. Unknown keys are rejected. Errors come back as 400 with the field path, e.g. `ctaUrl: Link must be an existing storefront page`.

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

### Admin — Settings

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/settings` | Singleton |
| PUT | `/api/admin/settings` | `{ "delivery_fee": 2.99, "free_delivery_threshold": 20 }`. Writes `id = 1` |

These values are editable but not yet applied at checkout.

---

### Admin — Jobs and applications

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/jobs` | Optional `?status=` |
| GET | `/api/admin/jobs/:id` | |
| POST | `/api/admin/jobs` | `title`, `location`, `type`, `salary`, `description`, `requirements` (non-empty string array), optional `status` (`draft` | `active` | `closed`). `applications` starts at 0 |
| PUT | `/api/admin/jobs/:id` | Partial |
| PATCH | `/api/admin/jobs/:id/status` | `{ "status": "closed" }` |
| DELETE | `/api/admin/jobs/:id` | Cascades applications |
| GET | `/api/admin/job-applications` | Optional `?job_post_id=`, `?status=` |
| GET | `/api/admin/job-applications/:id` | |
| POST | `/api/admin/job-applications` | Staff-created. `job_post_id` plus the public apply fields |
| PUT | `/api/admin/job-applications/:id` | `status`, `notes` |
| PATCH | `/api/admin/job-applications/:id/status` | `{ "status": "reviewed" }` |
| DELETE | `/api/admin/job-applications/:id` | |

Application status: `pending`, `reviewed`, `shortlisted`, `rejected`, `hired`.

---

### Admin — Dashboard

#### `GET /api/admin/dashboard/stats`

```json
{ "total_orders": 42, "active_orders": 5, "revenue": 456.78, "today_revenue": 89.5 }
```

| Field | Rule |
|---|---|
| `total_orders` | All orders |
| `active_orders` | Status not `delivered` and not `cancelled` |
| `revenue` | Sum of `total`, including cancelled |
| `today_revenue` | Sum of `total` since 00:00 UTC today, including cancelled |

Company-wide for every role; not branch-scoped.

---

## Frontend design

Crispies is a London halal burger-and-chicken brand. The storefront is black, white, and one red. Type is compressed and loud. Motion is led by scrolling and hovering, never decoration for its own sake.

**Voice:** bold, direct, youthful, London.
**Hero tagline:** "Always Good Mood Food."

The admin uses the same black canvas and red accent, but it is a dense working dashboard, not a marketing page.

System design is in [Architecture](#architecture). Endpoints are in [API](#api).

The storefront design is fixed. New data (branches, CMS copy, translations) is fed into the existing components; it is not a reason to redesign them.

---

### Colour

Tokens live in `client/app/globals.css`.

| Token | Value | Use |
|---|---|---|
| `--color-brand-black` / `bg-brand-black` | `#000000cc` | Translucent black surfaces, overlays, the store canvas |
| `--color-brand-white` | `#ffffff` | Primary text |
| `--color-brand-red` / `bg-brand-red` / `text-brand-red` | `#ff0931` | CTAs, active states, focus |
| Page black | `#000000` | `<body>` and true-black sections |
| White section | `#ffffff` | Instagram card, locations, menu, and other light blocks |

Hierarchy on black uses white at lower opacity (`text-white/40` to `text-white/70`), not a grey palette. Borders default to `border-white/10`; active or focused edges use brand red. Selection on the storefront is `bg-brand-red` with white text.

Red is the only brand accent. These functional exceptions are intentional:

| Colour | Where |
|---|---|
| `#E0082C` | Hover on red buttons and CTA bars |
| `#EE3346`, `#F7230B` | Flavour tile icons and divider dots (close to brand red, kept literal in SVG) |
| `#C1001F` | Darker red inner panels on order cards |
| `#434343` | Navbar vertical divider |
| `#414040` | Secondary text on white (Instagram profile) |
| `#1A1A1A` and nearby greys | Location map card |
| Green / brown pills | Open and closed status on locations |
| `#4ade80` / `#dc2626` | Admin toast success and error icons |

Raw values when a hex is needed (inline style, SVG fill, `shadow-[...]`): accent glow `rgba(255,9,49,0.4)` / `rgba(255,9,49,0.7)`, focus ring `rgba(255,9,49,0.15)`.

---

### Type

Loaded in `client/app/layout.tsx`. These four are the only families in use.

| Role | Family | Variable |
|---|---|---|
| Display and headlines | **Korolev** (local, compressed, weights 100–900) | `--font-korolev`, also `--font-display` |
| Body | **Plus Jakarta Sans** | `--font-jakarta`, also `--font-sans` |
| Buttons, nav chrome, labels, meta | **Inter** | `--font-inter` |
| Partner subcopy only | **Poppins** | `--font-poppins` |

Korolev files are in `client/public/fonts/`. Components usually apply fonts inline, e.g. `font-[family-name:var(--font-korolev),Korolev,sans-serif]`; `font-display` and `font-sans` are the Tailwind shortcuts.

- Display sizes use `clamp()` so one scale works from phone to wide desktop (for example `clamp(32px,7vw,60px)` for section headings).
- Headlines are tight (`leading-[100%]` or `leading-[1]`) and tracked at `0.54px`.
- Labels and kickers are small uppercase Inter with wide tracking (`0.12em`–`0.3em`).
- Body copy is small (`text-[13px]` range) and quieter than headlines.
- Admin headings: `font-display text-xl`. Admin body: `text-sm`.

---

### Layout

Store canvas: `min-h-screen bg-brand-black text-white` in `(store)/layout.tsx`. The homepage (`app/page.tsx`) sits outside that layout and paints its own stack on the same black.

Content width is `max-w-[1280px]` to `max-w-[1422px]`, padded `px-5` / `px-6` / `xl:px-10`. Breakpoints are Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).

Sections interlock. Black, white, and red blocks overlap with negative top margins (`-mt-[90px]` / `md:-mt-[140px]`) and large bottom radii (`rounded-b-3xl` to `lg:rounded-b-[50px]`) so one block tucks under the next.

Lenis smooth scroll (`components/providers/smooth-scroll.tsx`) wraps the store layout. Scrollbars are hidden (`scrollbar-hide`, `loc-scroll`).

---

### Homepage

`client/app/page.tsx`, top to bottom. It is a server component that reads `GET /api/store/cms/home`. Hero and welcome come first; the other sections render in the returned `order`. Each section receives CMS props and falls back to its built-in copy when a prop is missing. A section missing from `order` is not rendered.

| # | Component | What you see | CMS-managed |
|---|---|---|---|
| 1 | `navbar.tsx` | Black bar in normal flow (not fixed). Logo, Menu, Locations, Franchise. Cart button. Delivery opens `delivery-overlay.tsx`. Language switch. Mobile menu locks body scroll | — |
| 2 | `hero.tsx` + `hero.module.css` | Full-bleed looping video. Two-line Korolev headline. Words focus in from a 6px blur, 90 ms apart | Headline lines, video URL |
| 3 | `welcome.tsx` + `welcome.module.css` | Pinned scroll. The paragraph reveals word by word while a second food image slides over the first. A progress variable `--p` drives blur and opacity together | Paragraph |
| 4 | `flavours.tsx` | Black block with rounded bottom. "Discover Your Crispy Flavor" heading, red-dot dividers, a row of five white-outlined flavour tiles, a heat scale with a red track up to "Mild", and an endless image marquee with a white order card pinned in the centre | Titles, flavour and scale labels, tile and scale icons, gallery, CTA label and link |
| 5 | `locations.tsx` | "Find your nearest" list with open/closed pills and a Leaflet map card (`client-locations-map.tsx`). Shows the first `cardLimit` branches, or a single link in redirect mode | Heading, CTA, display mode, card limit |
| 6 | `partner.tsx` | Franchise pitch on red. Korolev headline, Poppins subcopy, black CTA bar, image on the right | Title, description, CTA label, image |
| 7 | `instagram.tsx` | White rounded card on a red base. Profile header (logo, username, counts, bio, red Follow button) and a reel marquee that pauses on hover | Username, counts, bio, profile URL, reels |
| 8 | `footer.tsx` | Black footer, red top rule, link columns | — |

`about.tsx`, `menu.tsx`, `order.tsx`, `stats.tsx`, `how-to-get-started.tsx`, and `download-app.tsx` remain in `components/store/` but are not on the live homepage.

When the CMS ordering mode is `redirect`, order buttons (flavours card, delivery flow) send the visitor to the external `https://` URL instead of the cart. The layout does not change.

---

### Store pages

These use `(store)/layout.tsx`, so they already have smooth scroll, toasts, and the navbar. Never add a second navbar inside a page.

| Route | Component | Role |
|---|---|---|
| `/menu` | `menu-page.tsx` | Branch menu and deals from the API in the existing cards, search, filters, add to cart |
| `/locations` | `locations-page.tsx` | Full branch list and map. Search uses `lib/location-search.ts` (postcodes.io, Nominatim) and `location-coverage.json` |
| `/delivery` | `delivery-page.tsx` | Pick a branch, then a platform. In redirect mode it goes straight to the external URL |
| `/franchise-inquiries` | `contact-page.tsx` | Franchise form, with `franchise-application-overlay.tsx` |
| `/checkout` | `(store)/checkout/page.tsx` | Server-quoted review, collection or delivery, contact details, cash/card label, confirmation |
| `/orders`, `/orders/[id]` | `(store)/orders/` | Guest profile, order history, one order with status |

The cart panel and the branch-switch dialog come from `BranchChrome` (`lib/branch-selection.tsx`) and appear on every page. Prices shown before the server quote returns are labelled as display prices. Checkout and order pages reuse the same black, white, and red styling; they are new pages, not a redesign.

Shared pieces: `scroll-tabs.tsx`, `optimized-image.tsx` (next/image, AVIF/WebP), `json-ld.tsx`.

Toasts on the store are top-centre pills: `#000000cc` background, white 13px semibold text, `border-white/10`, fully rounded, red icons. Admin toasts are bottom-right cards on solid black.

---

### Buttons and controls

Every interactive element needs `cursor-pointer`, a transition, a visible hover state, a press state, and a visible focus state.

**Navbar square buttons** (Inter, 15px, `tracking-[0.54px]`, `rounded-[4px]`, `px-7 py-3`, `btn-press`):
- Primary: `bg-[#FF0931] text-white`
- Outline: `border border-[#FF0931] text-[#FF0931]`

**Red CTA bar** (full width, e.g. "View all locations"):

```tsx
className="flex w-full items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px] bg-[#FF0931]
           hover:bg-[#E0082C] transition-colors duration-200 pl-6 sm:pl-8 pr-3 py-3 sm:py-3.5 text-white"
```

Label on the left, a white icon square (`w-10 h-10 rounded-[10px]`) with a red arrow on the right.

**Black CTA bar** (on red sections, e.g. Partner): same shape, `bg-black hover:bg-[#111]`, `max-w-[992px]`.

**Small red pill** (e.g. Instagram Follow): `rounded-[5px] bg-[#FF0931] px-5 py-1.5` Inter 13px semibold, `hover:bg-[#E0082C]`.

**Admin primary:** `rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50`
**Admin ghost icon:** `rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white`
**Admin destructive icon:** same as ghost with `hover:bg-brand-red/20 hover:text-brand-red`

**Inputs:**

```tsx
className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30
           outline-none transition-colors focus:border-brand-red/50"
```

Textareas match inputs. Checkboxes and radios use the brand-red accent.

**Focus:** `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red`.

#### Utility classes in `globals.css`

| Class | Behaviour |
|---|---|
| `.btn-press` | Pointer, lift 1px on hover, `scale(0.97)` on press, red focus outline |
| `.card-hover` | Pointer, lift 2px and shadow on hover |
| `.micro-elevate` | Small lift on hover and press (flavour tiles) |
| `.link-underline` | Red underline grows from the left on hover |
| `.icon-spin` | Rotates 90° on hover |
| `.ripple` | Radial ripple on press |
| `.input-focus` | Red focus border |
| `.skeleton` | Shimmer loading block, stays within `white/5`–`white/10` |
| `.loc-list` / `.loc-row` / `.loc-hover-red` | Location list hover: other rows dim and blur, hovered row turns red |
| `.nav-enter`, `.menu-drop`, `.menu-item`, `.backdrop-in`, `.burger-line` | Navbar entrance and mobile menu |
| `.overlay-backdrop-in`, `.overlay-panel-in`, `.overlay-fade-up`, `.overlay-fade-in`, `.overlay-scale-in`, `.stagger-1`…`.stagger-7` | Delivery and franchise overlays |
| `.redirect-spinner` | Delivery "taking you to your order" spinner |
| `.admin-fade-in`, `.admin-slide-up`, `.admin-scale-in` | Admin entrances |
| `.toast-enter`, `.toast-exit`, `.toast-shake`, `.toast-icon`, `.toast-progress` | Admin toast motion |
| `.crispy-map`, `.crispy-marker*` | Leaflet controls and red pins |

---

### Motion

| Place | How |
|---|---|
| Hero headline | Per-word blur focus in CSS, 90 ms stagger |
| Welcome | Scroll-scrubbed word reveal and image crossfade |
| Section entrances | `lib/use-scroll-reveal.ts` + GSAP on `.fade-up` elements with `data-delay` |
| Flavours gallery, Instagram reels | GSAP endless marquee (`xPercent: -50`, linear, repeat), pauses on hover |
| Navbar | Desktop drop-in (0.55 s, `cubic-bezier(0.16,1,0.3,1)`), mobile panel and staggered links |
| Location rows | Hover dims and blurs the others, highlights the active row |
| Buttons | `btn-press` |
| Admin modals | GSAP: backdrop `power2.out`, content `back.out(1.7)` |
| Admin toasts | Overshoot enter, slide-right exit, shake on error, delayed icon pop, linear progress bar |

`prefers-reduced-motion: reduce` turns off the hero word animation and every CSS motion utility listed above.

---

### Admin

Dark shell, never the marketing layout.

`app/admin/layout.tsx` checks the `crispy_admin_session` cookie before rendering admin pages, using skeletons during verification. `/admin/login` renders without the shell. The authenticated shell is lazy-loaded from `admin-shell.tsx`:

- `sidebar.tsx`: fixed left, 256px or collapsed to 80px, `border-r border-white/10`. Links: Dashboard, Menu, Categories, Orders, Customers, Staff, Branches, Deals, Branch Menu, Job Posts, Locations. A **Content** group underneath lists the CMS pages from `GET /api/admin/cms/pages`; it only appears for a superadmin. Settings and Sign out sit at the bottom.
- Active item: `bg-brand-red text-white shadow-lg shadow-brand-red/20`. Inactive: `text-white/50 hover:bg-white/5 hover:text-white`. Icons `group-hover:scale-110`.
- `topbar.tsx`: `sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10`, page title and mobile menu trigger.
- Content area: `p-4 sm:p-6`, offset by the sidebar. Collapse animates with `transition-all duration-300`.
- UI kit: `modal.tsx`, `dropdown.tsx`, `page-header.tsx`, `stat-card.tsx`, `skeleton.tsx`, and `components/ui/select.tsx` (Radix).

Surfaces stay `bg-black` with `border-white/10` and `bg-white/5` hovers.

Screen notes:

- **Orders:** the status dropdown lists only the current status plus `allowed_statuses` from the server. Detail shows stored line prices and totals.
- **Branch Menu:** per-branch price override (empty clears it) and an on/off availability toggle per row. It labels the catalogue as development mock data.
- **CMS** (`/admin/cms/[page]`, superadmin only): forms are drawn from the server's field definitions (`cms-fields.tsx`), so a new registry field needs no editor code. One English/Arabic selector with `translated/total` coverage; per section a show/hide toggle, a publish toggle for that language, up/down ordering on sortable pages, save, discard, and reset. Lists can add, remove, and reorder items. Every image field uploads (5 MB) and every video field uploads up to 50 MB via `/api/admin/upload-media`. Unsaved changes are flagged and leaving the page warns. The editor never sets fonts, spacing, or colours.
- Forms that take images upload through `POST /api/admin/upload` and store the returned Cloudinary URL.

---

### Localisation in the UI

English is the default; Arabic is the second language, and choosing it flips the storefront to right-to-left (`dir="rtl"` on `<html>`). Navbar labels, cart, checkout, and order pages read the dictionary in `client/lib/i18n/`, falling back to English for any missing key. Menu categories, items, and deals carry Arabic names (`title_ar`, `name_ar`, `description_ar`) edited in admin and shown in the Arabic store with English fallback; cart lines and order items are stored in the customer's language. Order status codes stay English in the API and are translated only when rendered. Money always uses `formatCurrency` (GBP, `en-GB`). Switching language sets `crispy_locale` and refreshes the page; it never clears the cart. The admin interface stays English.

---

### Images and security policy

`next.config.ts` allows remote images from Unsplash, Cloudinary (`res.cloudinary.com`, `*.cloudinary.com`), and `www.zycocudi.us`. Formats are AVIF and WebP. SVG through the image optimiser is off. Optimised images are cached for 30 days.

The Content-Security-Policy allows Instagram and TikTok frames and scripts, Cloudinary and TikTok media, Carto basemap tiles, postcodes.io, Nominatim, and the API origin. Anything new that loads from another host needs adding there.

---

### Rules when changing UI

- Stay on black, white, and `#ff0931` unless the screen already has a listed exception.
- New headlines use Korolev. Body stays Jakarta. Buttons and small chrome stay Inter. Do not add new font families.
- Every interactive element gets pointer, hover, press, and focus states.
- Store pages under `(store)/` already have a navbar. The homepage owns its own.
- Do not import admin components into the storefront, or the reverse.
- Prefer Tailwind. The existing `hero.module.css`, `welcome.module.css`, and `about.module.css` can stay; do not add another styling system.
- Feed new data into existing components instead of changing their layout, type, colour, spacing, or motion.
- Check a laptop width and a phone width whenever a section's overlap or `clamp()` size changes.
