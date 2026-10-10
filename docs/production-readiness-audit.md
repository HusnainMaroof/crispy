# Production Readiness Audit

Status: **Not ready to launch** until the blockers below are closed.

Last reviewed: 2026-10-08.

Related docs:

- `docs/backend-audit.md`: route inventory and first-pass audit
- `docs/backend-optimizations.md`: performance passes and measurements

## How to read this file

- **Blocker**: must be fixed before production traffic.
- **Should fix**: fix before or soon after launch.
- **Info**: known, accepted, or noted for later.

Each item shows its status: `Done`, `Open`, or `Accepted`.

## 1. Summary

| Area | Status | Notes |
| --- | --- | --- |
| Admin authentication | Done | DB re-check on every request, scrypt hashes, login limiter |
| Branch scope (SQL) | Done | Enforced in queries for orders, customers, staff, jobs |
| Role and tab checks | Done | Branch managers cannot grant higher roles or tabs |
| Order ownership | Done | Owner match is in the SQL where clause |
| Checkout key reuse | Done | Another customer's key gets 409 |
| Session revocation | Done | `token_version` checked on every request; logout bumps it; 15 s session cap (B1) |
| Upload security | Done | Superadmin-only upload; CV URL limited to own Cloudinary account (S1) |
| Performance | Done | Menu, customers, staff list round-trips reduced |
| Automated tests | Done | 169 tests, 166 pass, 3 skipped, 0 fail |
| Secrets handling | Partly done | Superadmin password rotated (B2); old line in `server/.env` still to remove |
| Monitoring and alerts | Open | Sentry DSN and uptime check not set yet (S4) |
| Backups and restore | Open | Neon project for production not reachable with current login (B3) |

## 2. Blockers

### B1. Admin tokens cannot be revoked

- Severity: MEDIUM in the audit, treated as a blocker for launch.
- Where: `server/src/controllers/admin/auth.controller.ts` (`logout`, `refresh`).
- Problem: JWTs last 7 days. Logout only clears the cookie. Refresh issues a new 7-day token from any still-valid token. A stolen token keeps working until it expires or the account is deactivated.
- Fix: add a `token_version` column on `admin_profiles`. Put the version in the JWT. Bump it on logout and on password change. Check it in `authenticate`. Also cap session age on refresh.
- Status: Done. Verified in `tests/admin-session-revocation.test.ts` (12/12).

### B2. Plaintext admin password in `server/.env`

- Where: `server/.env` (gitignored, but present on this machine).
- Problem: the admin password was read from the file during testing.
- Fix: rotate the password. Keep secrets in the host's secret store. Do not paste them into chat or docs.
- Status: Rotated. Remove the old line from `server/.env` (user action).

### B3. Backups and restore not verified

- Problem: no restore test has been run for the Neon database.
- Fix: confirm the Neon branch and backup policy. Run one restore into a branch and check row counts and a login.
- Status: Open. The app DB host is `ep-falling-unit-b1q3kfa1` (eu-central-1). The logged-in Neon account only sees project `diplostay` (ap-southeast-1), which is a different project. Need access to the Crispy project.

## 3. Should fix before or soon after launch

| ID | Area | Finding | Fix | Status |
| --- | --- | --- | --- | --- |
| S1 | Jobs | `cv_url` accepts any http(s) host and is shown to admins as a link | Accept only the Cloudinary host for public applications | Done |
| S2 | Customers | `crispy_customer_id` is an unsigned cookie holding a UUID | Sign the cookie or use a server session | Done (HMAC-signed; old unsigned guest cookies start a new identity) |
| S3 | Abuse | Contact, brochure, and translate have only the global 100 per 15 min per IP limit | Add per-endpoint limits | Done |
| S4 | Monitoring | No error tracker or uptime check reviewed | Confirm `reportError` target and add an uptime check on `/health/ready` | Open (needs Sentry DSN and uptime account) |
| S5 | Email | Resend key was rejected (401) in local runs | Verify key and verified sender domain | Open |
| S6 | Lint | Full `pnpm lint` passed on 2026-10-08 (exit 0). Recheck before launch | Keep lint in the release check | Done |
| S7 | CMS | CMS section writes use `requireTab("content")` only | Superadmin-only for section patch, move, and reset | Done |
| S8 | Location reads | `GET /admin/locations/:id` shows other branches' business info to branch managers | Already enforced by `assertLocationAccess`; tested | Done |

## 3a. Deployment topology and revocation cache

- `render.yaml` defines one web service on the Render `free` plan. No instance count is set.
- One API instance: the 15 s admin auth cache (`TTL_ADMIN_AUTH_SECONDS`) is acceptable. Logout and staff changes take effect on the same instance at once.
- More than one instance: set `CACHE_REDIS_URL` and `CACHE_REDIS_TOKEN` (shared cache). Without it, a revoked admin can keep access for up to 15 s on another instance.
- Re-check this if the Render plan or instance count changes.

## 4. Verified controls

### Authentication

- `authenticate` loads the live profile on each request (cached 15 s). Inactive users get 401.
- Passwords use scrypt. Unknown emails run a dummy scrypt compare, so timing does not reveal accounts.
- Login errors are generic.
- Login limiter: 10 attempts per 15 min per IP. Successful logins are not counted.
- Cookie: httpOnly, SameSite=Lax, Secure in production.
- Bearer tokens are accepted for API clients.

### Authorization and branch scope

- `requireRole` and `requireTab` run on every admin mount.
- Branch scope uses `getAccessibleLocationIds` and filters in SQL.
- Branch managers can only grant tabs they hold, and only assign their own branches.
- Staff cannot manage staff.
- Super admin role cannot be created through the API (`staffRoleSchema`).

### Customer and orders

- Prices and totals are computed on the server from `quoteCart`.
- Checkout key reuse returns the original order only to its owner. Another customer gets 409.
- `GET /api/orders/:id` filters by owner in SQL and returns 404 otherwise.
- `POST /api/orders/lookup` filters by owner in SQL.

### Input validation

- Zod schemas on all write routes. Unknown fields are stripped.
- Length caps and enums are set on text and status fields.
- Services use explicit field lists, not blind spreads of request bodies.

### Uploads

- Admin uploads are superadmin-only. Public CV uploads are rate-limited (20 per 15 min).
- Cloudinary public ids are generated on the server.
- Multer limits: 5 MB for CVs and images, 50 MB for media.
- Cloudinary errors are logged and not returned to clients.

### Errors, logs, headers

- Production errors return a generic 500 with no stack.
- Logs redact authorization headers, cookies, and passwords.
- Helmet is enabled. CORS origin must be explicit in production.

### Performance

| Route | App SQL before | App SQL after | Waits before | Waits after |
| --- | --- | --- | --- | --- |
| `GET /api/admin/menu` | 3 | 3 | 3 | 1 |
| `GET /api/admin/customers` | 4 | 4 | 3 | 2 |
| `GET /api/admin/staff` | 4 | 4 | 3 | 2 |

Warm latency is about 330 ms per route on the current Neon setup. The network floor to the Neon pooler is about 160 ms.

## 5. Test status

| Check | Result |
| --- | --- |
| `pnpm typecheck` (server) | Pass |
| `pnpm test` (server) | 142 tests, 139 pass, 0 fail, 3 skipped |
| ESLint on changed files | Pass |
| `pnpm lint` (full server) | Pass (exit 0) |
| HTTP checks on admin and order routes | Pass |

Not covered yet:

- A full HTTP sweep of every admin route for IDOR.
- Load testing.
- Restore test (B3).
- Browser tests of the client apps.

## 6. Launch checklist

- [ ] B1: token revocation implemented and tested
- [ ] B2: admin password rotated, secret moved out of `.env`
- [ ] B3: backup and restore tested
- [ ] S1 to S3 closed or accepted in writing
- [ ] S4: error tracking and uptime check live
- [ ] S5: email sends verified from the production sender
- [x] S6: full lint passes (recheck before launch)
- [ ] Production env: `NODE_ENV=production`, explicit `CORS_ORIGIN`, strong `JWT_SECRET`
- [ ] Rate limit env reviewed (`RATE_LIMIT_MAX`)
- [ ] `SLOW_QUERY_MS` left at 0 in production

## 7. Sign-off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Engineering | | | |
| Security | | | |
| Operations | | | |
