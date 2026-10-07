# Crispies — Architecture

How the Crispies system is put together: apps, data flow, auth, database, and the rules the code follows.

Related docs: [Project guide](./README.md) (history, full API, frontend design) and [Backend](./backend.md) (endpoints and server conventions).

---

## System at a glance

Crispies is a London halal burger-and-chicken brand. This repo holds its public storefront, its staff admin, and the API behind both.

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
        └─ Resend                 order and status emails
```

The Next app never opens a database connection. Every read and write goes through Express. There is no Supabase anywhere in the running system; older notes that mention Supabase Auth, service-role keys, RLS, Postgres enums, or `get_dashboard_stats()` are out of date.

---

## Apps, ports, and environment

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
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Yes | Transactional email. `EMAIL_FROM` must be a sender verified in Resend |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | Uploads |
| `LOG_LEVEL` | No | Pino, default `info` |

### Commands

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
pnpm seed:catalogue   development catalogue (upsert, never deletes, refused when NODE_ENV=production)
pnpm db:ping          Neon connectivity check
```

Never run `prisma db push` or `prisma migrate reset` against the live database. Schema changes go through a new migration folder and `pnpm migrate`.

---

## Client

**Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, Redux Toolkit, GSAP, Lenis, Leaflet, react-hot-toast.

### Routes

The homepage (`app/page.tsx`) is a server component outside the `(store)` group. It renders its own navbar, fetches `GET /api/store/cms/home` with `cache: "no-store"`, and falls back to built-in copy if that call fails.

Pages under `app/(store)/` share `layout.tsx`: Lenis smooth scroll, a toast host, and the store navbar.

| URL | What it is |
|---|---|
| `/` | Homepage: hero, welcome, flavours, locations, partner, Instagram, footer |
| `/menu` | Menu from `GET /api/menu/full` and `/api/menu/deals`, add to cart |
| `/locations` | Branch list, search, and map |
| `/delivery` | Branch picker for delivery, or an external redirect when the CMS says so |
| `/franchise-inquiries` | Franchise form |
| `/career` | Open roles from `GET /api/store/jobs`, with a branch filter |
| `/career/[id]` | One role and the application form, posting to `/api/jobs/:id/apply` |
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

### Data on the client

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

### Folder map

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

## Server

**Stack:** Node (ESM), Express 4, TypeScript (strict), Prisma 7 with `@prisma/adapter-pg`, Zod, Pino, Helmet, CORS, compression, cookie-parser, express-rate-limit, multer, Cloudinary, Resend, jsonwebtoken.

### Request pipeline (`src/index.ts`)

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

### Layers

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
| `email.service.ts`, `email-templates.ts` | Resend send and HTML |
| `upload.service.ts` | Cloudinary image and video upload |

---

## Staff auth and roles

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
| Job posts and applications | All branches | Assigned branches | No |
| Manage team accounts | All | Staff in assigned branches only | No |
| Site content, settings, shared catalogue | Yes | No | No |
| Edit own name | Yes | Yes | Yes |

Only three account roles can be assigned: `superadmin`, `branch_manager`, and `staff`. Staff accounts have a job position such as Cashier or Kitchen staff; the position is descriptive, while tab permissions control access. Existing `admin` accounts become branch managers in the migration. Accounts with no branch assignment are deactivated until the super admin assigns a branch and reactivates them.

Branch lists are read at request time, so removing an assignment takes effect before the token expires.

---

## Customer identity and cookies

There are no customer accounts. A guest is identified by a cookie.

| Cookie | Set by | Lifetime | Use |
|---|---|---|---|
| `crispy_customer_id` | `identifyCustomer` when missing | 1 year (not refreshed) | Guest id. Equals `customers.id` and `orders.customer_id` |
| `crispy_location_id` | `PATCH /api/store/location` (active branch only) | 90 days | Selected branch for menu and deals |
| `crispy_locale` | Storefront language switcher | Client cookie | `en` or `ur` |

Server cookies are `httpOnly`, `sameSite=lax`, path `/`, and `secure` in production.

The first order (or a profile save) creates the `customers` row. Two browsers are two customers, even with the same email; nothing is merged.

---

## Ordering flow

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

### Branch menu

`menu_items` and `deals` are the global brand catalogue. `branch_menu_items` and `branch_deals` say which of those a branch sells and at what price:

- No row: the branch does not sell it.
- `price` null: use the global price. A number overrides it.
- `available = false`: hidden at that branch only.

A menu request with no branch returns the global catalogue. With a branch it returns only available lines, with the effective price, and drops empty categories. There is no per-branch category table.

### Cart

Client only, never stored on the server. One `locationId` for the whole cart. Lines are `{ id, kind: "product" | "deal", name, price, quantity }`; `price` is a display value only. Picking a different branch with items in the cart opens a dialog: keep the branch, or clear the cart and switch.

### Quote and checkout

The server ignores every client price. For each line it loads the catalogue row and the branch row and requires: branch exists and is `active`, catalogue row `active`, branch row present and `available`. Unit price is the branch override or the global price. Money is summed with Prisma `Decimal` and rounded once.

Checkout re-runs the quote at submit time (an earlier quote is never reused), then writes `orders` and `order_items` in one transaction. `checkout_key` (a UUID kept in `sessionStorage` until success) is unique on `orders`, so a retried submit returns the original order. The cart is cleared only after success. Emails are attempted after commit; a send failure is logged and never rolls back the order.

Delivery requires address, postcode, and city. Collection stores no address. `payment_method` (`card` / `cash`) is a label only; nothing is charged.

### Order snapshot

`order_items` stores `name`, `price`, `quantity`, and `kind`. Products set `menu_item_id`; deals set `deal_id`. Both links are `ON DELETE SET NULL`, so deleting or repricing a product never changes a past order.

### Status workflow

The server is the only place that decides the next status. Every admin order payload includes `allowed_statuses`.

| Fulfilment | Path |
|---|---|
| Collection | `pending` → `preparing` → `ready` → `delivered` |
| Delivery | `pending` → `preparing` → `ready` → `out-for-delivery` → `delivered` |

`cancelled` is allowed from `pending`, `preparing`, and `ready`. `delivered` and `cancelled` are terminal. The write is `updateMany` on id + current status, so a lost race returns 409.

### Emails (Resend)

| Trigger | Recipient |
|---|---|
| Order created | Customer confirmation, plus a new-order notice to `ADMIN_EMAIL` |
| Status `cancelled` | Customer cancellation |
| Status `delivered` | Customer delivered |
| Any other status | Customer status update |
| `POST /api/franchise/brochure` | Customer brochure link, plus a lead notice to `ADMIN_EMAIL` |

---

## Branch states: active, coming soon, disabled

`locations.status` is `active` or `inactive`. A separate idea, marked in the `hours` text, says whether the branch is open yet:

| State | How it is stored | What customers see |
|---|---|---|
| Active (open) | `status = active`, real hours, for example `Every day · 11:00 AM – 11:00 PM` | Listed, green "Open Now" or "Closed" pill by hours |
| Coming soon | `status = active`, `hours = "Coming Soon"` | Listed, grey "Coming Soon" badge, hours show "Coming Soon" |
| Disabled | `status = inactive` | Hidden from the public branch list. For maintenance |

`hours: "Coming Soon"` is the single marker for a branch that is not open yet. The super admin Branches form offers it as the `Coming soon` status, `lib/admin/shop-hours.ts` reads it back, and `lib/storefront-locations.ts` turns it into the `coming_soon` card state.

The location search (`lib/location-search.ts`) treats coming soon branches as their own state:

- Name search still finds them, and the result is labelled "Coming Soon".
- Distance search (postcode or area) prefers open branches. A coming soon branch only wins when no open branch is in range.
- The result line and the branch badge say "Coming Soon" instead of "Closed".

---

## CMS and locales

`server/src/config/cms-registry.ts` is the single definition of the CMS. Each page (`site`, `home`, …) lists its sections, and each section lists its fields. A field has a kind (`text`, `image`, `video`, `link`, `url`, `number`, `select`, `toggle`, `list`), limits, and a default equal to the storefront's built-in copy. `validators/cms.schema.ts` turns a section's fields into a strict Zod schema; the admin editor renders the same definitions.

`cms_sections` has one row per `(page, key)` with `sort_order` and `is_active`. Rows are created on first open of a page in the admin, so a new registry section needs no migration. Copy lives in `cms_section_translations`, unique on `(section_id, locale)`: `content` JSON and `is_published`.

The public read (`getPublicCmsPage`) skips inactive sections. For the rest it takes the published copy in the requested locale, else published English, else nothing, and lays that over the registry defaults, so every field is always present. `site.ordering.mode = "redirect"` sends order buttons and `/delivery` to an external `https://` URL instead of the cart.

Supported locales are `en` (default) and `ur`, resolved by `?locale=`, then `crispy_locale`, then `Accept-Language`, then `en`. UI strings come from a dictionary that falls back to English. Addresses, names, prices, and order snapshots are never translated. Money is always GBP formatted as `en-GB`. There are no `/en` or `/ur` URL prefixes.

---

## Database

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

### Delete rules

| From | To | On delete |
|---|---|---|
| `menu_items.category_id` | `menu_categories` | Cascade |
| `orders.location_id` | `locations` | Set null |
| `orders.customer_id` | `customers` | Set null |
| `order_items.order_id` | `orders` | Cascade |
| `order_items.menu_item_id` / `deal_id` | `menu_items` / `deals` | Set null |
| `branch_menu_items`, `branch_deals`, `admin_branch_access` | parent rows | Cascade |
| `job_applications.job_post_id` | `job_posts` | Cascade |
| `job_posts.location_id` | `locations` | Set null |
| `cms_section_translations.section_id` | `cms_sections` | Cascade |

Branch "delete" in the admin sets `status = inactive` instead, so orders keep their branch.

A job post belongs to one branch. `job_posts.location_id` is the relation used for filtering and permission checks, while `job_posts.location` is a display copy of the branch name taken on write. `location_id` is nullable so posts created before branch scoping keep existing; branch-scoped admins cannot see an unbound post.

### Migrations (`server/prisma/migrations/`)

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

### Seed data

The nine branches: Harrow Road, Tower Hill, Kilburn, Harrow, Elephant & Castle, Edgware Road, Stockwell, Wembley Central, Ruislip. Wembley Central and Ruislip are `active` with hours `Coming Soon`, so the storefront shows them with the `Coming Soon` badge.

---

## Design decisions worth knowing

- **One brand, no organization table.** A second brand would need a real tenant migration.
- **`locations` is the branch.** There is no separate `branches` table; the admin and API still say "location".
- **Coming soon is hours text, not a column.** `hours = "Coming Soon"` marks a branch that is not open yet, so the storefront, admin, and search all read one marker.
- **Categories stay global.** A branch shows a category when it has an available item in it.
- **Deals are separate from products.** They become order lines through `order_items.kind = "deal"` and `deal_id`.
- **Branch fee overrides** are nullable columns on `locations`; null means use `business_settings`.
- **No modifiers, no server cart, no Instagram post table.** Instagram reels are CMS JSON pointing at real Instagram URLs.
