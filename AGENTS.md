# Agent instructions

Read this file before starting work in this repo.

## What this project is

Crispies (crispiesuk.com) is a London halal burger and chicken brand with nine branches. This repo is its website.

| Part | Path | Stack |
| --- | --- | --- |
| Storefront + staff admin | `client/` | Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Redux Toolkit, GSAP, Lenis, Leaflet |
| API | `server/` | Node ESM, Express 4, TypeScript strict, Prisma 7 (`@prisma/adapter-pg`), Zod, Pino, Sentry |
| Database | Neon Postgres | Only the API talks to it, through Prisma |
| Services | | Cloudinary (uploads), Resend (email) |

```
Browser -> Next.js (client/) -> /api rewrite -> Express (server/) -> Prisma -> Neon Postgres
                                                    |-> Cloudinary, Resend
```

- The browser never touches the database. Express is the only DB client.
- Public `/api/*` is rewritten by `client/next.config.ts` to `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000`).
- Admin calls go through `client/app/api/admin/[...path]/route.ts`, which forwards cookies so the HttpOnly admin session works.

Full docs: `docs/README.md` (project guide, every endpoint, design), `docs/architecture.md`, `docs/backend.md`, `server/src/routes/admin/API.md`. Some doc lines are older than the code. If they disagree, trust the code.

## Core ideas

| Idea | Meaning |
| --- | --- |
| Branch | A row in `locations`. There is no `branches` table. Code and API still say "location" |
| Global menu + branch lines | `menu_items` / `deals` are defined once. `branch_menu_items` / `branch_deals` say if a branch sells it and can override the price. No row = not sold. `price` null = global price |
| Ordering mode | CMS `site.ordering.mode`. `redirect` (default) sends customers to Uber Eats, Deliveroo or Just Eat via a branch popup, and turns off cart and `/checkout`. `cart` uses the built-in cart |
| Delivery links | Per branch: `redirect_uber_eats`, `redirect_deliveroo`, `redirect_just_eat`. Empty falls back to the site-wide CMS link |
| Coming soon | `hours = "Coming Soon"` marks a branch that is listed but not open |
| Cart (cart mode) | Client only, `localStorage` key `crispies_cart`, one branch per cart. Prices there are display only |
| Server pricing | Quote and checkout re-price every line on the server and ignore client prices |
| Order snapshot | `order_items` copy name and price. Catalogue edits never change old orders |
| Guests | No customer accounts. Cookie `crispy_customer_id` identifies the guest |
| Staff roles | `superadmin` (all), `branch_manager` and `staff` (assigned branches + allowed tabs). Tabs in `server/src/config/admin-tabs.ts` |
| CMS | One registry: `server/src/config/cms-registry.ts`. Sections and fields defined there drive the admin editor, Zod validation and public defaults |
| Locales | `en` (default) and `ar` (Arabic, RTL). Old `ur` values map to `ar`. No URL prefixes, cookie `crispy_locale`. Money is always GBP |
| Fixed design | The storefront look is fixed. Feed new data into existing components, do not redesign |

## Where things live

| You want to change | Look in |
| --- | --- |
| A storefront section or page | `client/app/components/store/`, routes in `client/app/(store)/`, homepage `client/app/page.tsx` |
| An admin screen | `client/app/super-admin/`, hooks in `client/lib/admin/`, UI in `client/app/components/admin/` |
| Branch / staff URL rewrites, `/admin` and `/login` redirects | `client/middleware.ts` |
| Cart or branch selection | `client/lib/redux/slices/cartSlice.ts`, `client/lib/cart-model.ts`, `client/lib/branch-selection.tsx` |
| Store branch list and ordering mode | `client/lib/use-store-locations.ts`, `client/lib/use-store-ordering.ts`, `client/lib/storefront-locations.ts` |
| Location / postcode search | `client/lib/location-resolution.ts`, `server/src/services/location-*.ts` |
| Client fetch wrapper | `client/lib/api.ts` (cookie auth, one refresh + retry on 401, one retry on 429) |
| UI strings | `client/lib/i18n/` |
| An endpoint | `server/src/routes/` -> `controllers/` -> `services/`, Zod in `validators/` |
| The database | `server/prisma/schema.prisma` + a new folder in `server/prisma/migrations/` |
| Env vars | `server/src/config/env.ts`, `server/.env.example` |

Server layers:

- `routes/`: `validate(schema)` + `asyncHandler`. No logic, no try/catch.
- `controllers/`: thin, call services, `sendSuccess()`.
- `services/`: Prisma, pricing, email, uploads. Throw named errors from `utils/app-error.ts`.
- `src/generated/prisma`: generated Prisma client. Never edit.
- Response envelopes must stay compatible with `client/lib/api.ts`.

## Commands

| Where | Command | Does |
| --- | --- | --- |
| `client` | `pnpm dev` / `build` / `typecheck` / `lint` | Next app |
| `client` | `node --experimental-strip-types --test lib/cart-model.test.ts lib/i18n/i18n.test.ts lib/location-resolution.test.ts` | Client unit tests |
| `server` | `pnpm dev` | nodemon + tsx, port 4000 |
| `server` | `pnpm build` | `tsc` then `scripts/fix-dist-imports.mjs` |
| `server` | `pnpm typecheck` / `lint` | Checks |
| `server` | `pnpm test` | `tsx --test tests/**/*.test.ts`. Hits the configured database |
| `server` | `pnpm prisma:generate` / `pnpm migrate` | Prisma client / `migrate deploy` |
| `server` | `pnpm seed`, `seed:catalogue`, `seed:jobs`, `db:ping` | Seeds and Neon check. `seed:catalogue` refuses to run in production |

Package manager is pnpm, separately in `client/` and `server/`. CI (`.github/workflows/ci.yml`) runs install, typecheck and build for both. Run `pnpm typecheck` in each app you touched before finishing.

## Database rules

- Never run `prisma db push` or `prisma migrate reset`. The DB in `.env` may be the live Neon database.
- Every schema change is a new migration folder, applied with `pnpm migrate`.
- Status, role and fulfilment columns are text, not Postgres enums. Money is `numeric(10,2)`.
- `orders.location_id`, `order_items.menu_item_id`, `order_items.deal_id` stay nullable with `ON DELETE SET NULL`.
- Deleting a branch in admin sets `status = inactive`. It never deletes the row.

## Deploy

- Push to `main` -> CI -> CD (`.github/workflows/cd.yml`) SSHes to a VPS at `/var/www/crispies`, builds both apps, runs `pnpm migrate`, restarts pm2 apps `crispies-api` and `crispies-web`.
- `render.yaml` and `client/vercel.json` are older deploy configs.
- Never push. The owner pushes.

## Known gaps

- No payment processing. Card and cash are labels only.
- Delivery fee and free delivery threshold are not applied.
- Dashboard stats are not branch-scoped.
- No browser end-to-end tests. Server rules are covered in `server/tests/`.

## Runtimes

| App | Directory | Port | Start only if nothing is listening |
| --- | --- | --- | --- |
| API | `server` | 4000 | `pnpm dev` |
| Store / admin | `client` | 3000 | `pnpm dev` |

Before starting the client or the server:

1. Check whether that app is already running. On Windows: `netstat -ano | findstr :4000` or `findstr :3000`.
2. If the port is in use and the app responds, use that process. Do not start a second copy.
3. If it is not running, start it yourself with `pnpm dev` in that directory.
4. If any runtime is already active, work on that one and run your tests against it. Only create a new runtime when nothing is active for that app.

`pnpm start` in `server` binds the same port 4000. Never start it while another API process is already listening.

## Shut down what you started

Kill every client or server process you started, at the end of every task. This is not optional and does not depend on the task finishing cleanly.

- Kill only those processes. Leave a server or dev app that was already running when you arrived.
- Confirm the port you opened is free before you finish.
- Do not leave `pnpm dev`, `pnpm start`, `node dist/index.js`, or `next dev` running from your session.
- Do not end a task with a process still listening on port 3000 or 4000 that you started.

## Response style

Apply this to every response: code, explanation, and discussion.

| Rule | Meaning |
| --- | --- |
| No over-explain | Get to the point. Skip extra background. |
| Simple words | Use easy words. Avoid heavy jargon. |
| English only | Every reply is in English. No Hindi, no Hinglish, no mixed language. |
| English in the repo | Every file in the repo stays in English. |
| No long paragraphs | Break the answer into short pieces. |
| Points and tables | Use bullets or tables. |
| Proper spacing | Leave space between lines. Do not pack text together. |
| Crisp | Say only what is needed. |
| No em-dashes | Do not use an em-dash. Use a comma or a period. |
| No emojis | Do not use emojis. |

## Real data only

Never invent placeholder or fake rows to make a feature look done.

- Seed and demo against the real branches, real products and real accounts that already exist in the database.
- Match on the real column values, for example a branch `slug`, not a made-up name.
- If real data does not exist yet, ask before creating it, and say exactly which rows you will write.
- A seed script must be idempotent, so running it twice leaves the same rows.
