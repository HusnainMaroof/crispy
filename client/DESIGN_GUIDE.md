# Crispies — Client Design Guide

## Brand Identity

Crispies is a London-based halal fast-food brand (burgers + chicken). The visual identity is **dark, bold, and premium** — black canvas with high-contrast red accents, cinematic imagery, and kinetic typography.

**Tagline:** "Good mood food."
**Voice:** Bold, direct, youthful, London-rooted.

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-black` / `bg-brand-black` | `#000000` | Primary background (every page) |
| `--color-brand-white` / `text-white` | `#ffffff` | Primary text color |
| `--color-brand-red` / `bg-brand-red` / `text-brand-red` | `#dc2626` | Accent — CTAs, highlights, active states, borders on focus |
| `white/5` | `rgba(255,255,255,0.05)` | Subtle card/button backgrounds |
| `white/10` | `rgba(255,255,255,0.10)` | Borders, dividers, muted surfaces |
| `white/20` | `rgba(255,255,255,0.20)` | Secondary borders, ghost button borders |
| `white/30` | `rgba(255,255,255,0.30)` | Muted text, placeholder borders |
| `white/40` | `rgba(255,255,255,0.40)` | Secondary body text |
| `white/50` | `rgba(255,255,255,0.50)` | Muted labels, non-active nav items |
| `white/60` | `rgba(255,255,255,0.60)` | Default nav link color |
| `white/70` | `rgba(255,255,255,0.70)` | Secondary subdued text |
| `bg-red-700` | `#b91c1c` | Button hover state (admin) |
| `green-400/500` | success toasts | Icon theme for success |

**Rules:**
- Background is **always black** (`#000000`) — no gradients, no colored backgrounds.
- Text is **white** or **brand-red**. Never use gray text — use opacity (`text-white/XX`) for hierarchy.
- Red is the **only accent color**. No blue, no green (except toast icons), no yellow.
- Borders use `border-white/10` by default, `border-brand-red` for active/focused states.

---

## Typography

| Role | Font | CSS Variable | Tailwind Class |
|---|---|---|---|
| Display headings (hero, large titles) | **Bebas Neue** | `--font-bebas` | `font-display` |
| Body text, UI labels | **Plus Jakarta Sans** | `--font-jakarta` | `font-sans` |
| Hero mega-headlines | **Teko** | `--font-teko` | `font-teko` |
| Preloader wordmark | **Oswald** | `--font-oswald` | `[family-name:var(--font-oswald)]` |

**Sizing patterns:**
- Hero headings: `text-6xl` → `md:text-9xl` → `lg:text-[180px]` with `leading-[0.8]`
- Section titles: `text-lg` → `md:text-3xl`, uppercase, `tracking-wide` or `tracking-normal`
- Nav links: `text-[11px]`, uppercase, `tracking-[0.2em]`
- Body copy: `text-[13px]`, `text-white/50`
- Labels/kickers: `text-[9px]` → `text-[11px]`, uppercase, `tracking-[0.3em]`, `text-white/40`
- Admin headings: `font-display text-xl tracking-wide`
- Admin body: `text-sm`

**Rules:**
- All headings are uppercase unless specified.
- Use `tracking-[0.2em]` to `tracking-[0.35em]` for uppercase labels.
- Font display (`font-display`) is the default for all large headings.
- Teko is reserved for the hero "GOOD MOOD FOOD" mega-headline only.

---

## Layout

### Storefront
- **Canvas:** `min-h-screen bg-black`
- **Max width:** `max-w-[1400px]` with symmetric padding (`px-6 md:px-12 lg:px-16 xl:px-24`)
- **Navbar:** Fixed top, `h-16`, transitions from transparent to `bg-black/90 backdrop-blur-md` on scroll
- **Footer:** Full-width sections with `border-t border-white/10` dividers
- **No scrollbar** — replaced by custom right-side progress indicator

### Admin
- **Shell:** Sidebar (`w-64` expanded, `w-20` collapsed) + sticky topbar + main content area
- **Sidebar:** Fixed left, `border-r border-white/10`, scrollable nav
- **Topbar:** `sticky top-0 z-30`, `bg-black/80 backdrop-blur-md`, `border-b border-white/10`
- **Content:** `p-4 sm:p-6`, offset by sidebar width
- **Transitions:** Sidebar collapse animates with `transition-all duration-300`

---

## Buttons & Interactive Elements

### Every interactive element must have:
1. `cursor-pointer`
2. A `transition` property for hover/active states
3. A visible hover state
4. A press/active state (micro-animation)

### Button Variants

**Primary (brand-red filled):**
```tsx
className="rounded-full bg-brand-red px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-white
           transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 active:translate-y-0
           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
```

**Secondary (ghost/bordered):**
```tsx
className="rounded-full border border-white/30 bg-transparent px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60
           transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/5 hover:text-white
           active:translate-y-0"
```

**Admin primary:**
```tsx
className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white
           transition-colors hover:bg-red-700 disabled:opacity-50"
```

**Admin ghost (icon button):**
```tsx
className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
```

**Admin destructive:**
```tsx
className="rounded-lg p-2 text-white/50 transition-colors hover:bg-brand-red/20 hover:text-brand-red"
```

### Built-in Utility Classes (from `globals.css`)

| Class | Behavior |
|---|---|
| `.btn-press` | `cursor-pointer`, `hover:translateY(-1px)`, `active:scale(0.97)`, `focus-visible:brand-red outline` |
| `.card-hover` | `cursor-pointer`, `hover:translateY(-2px)`, `hover:box-shadow` |
| `.ripple` | Radial ripple overlay on `:active` |
| `.link-underline` | Red underline grows from left on hover |
| `.icon-spin` | Rotate 90° on hover |

---

## Micro-Animation Rules

These apply to **every action button and interactive element**:

### 1. Press Feedback (required on all buttons)
- **Hover:** Slight lift — `hover:scale-[1.02]` or `hover:-translate-y-1` (0.3s ease)
- **Active:** Scale down — `active:scale-95` or `active:scale-97` (0.15s ease)
- Use `transition-transform duration-300` or `btn-press` class

### 2. Link Hover
- **Nav links:** `transition-colors duration-200`, color changes from `text-white/60` to `text-white` (or `text-brand-red` when active)
- **Footer links:** `transition-colors hover:text-white`
- **Icon within a group:** `group-hover:scale-110 transition-transform duration-200`

### 3. Entrance Animations (Storefront)
Use GSAP `useGSAP` hook with `ScrollTrigger` for scroll-triggered reveals:
```tsx
gsap.from(".element", { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", scrollTrigger: { trigger, start: "top 85%" } })
```

CSS animation classes available:
- `.reveal-left` / `.reveal-right` / `.reveal-center` — clip-path reveals (hero, 0.8s)
- `.slide-in-right` — slide + fade (hero tagline, 1s)
- `.hero-fade-up` — fade + translateY (hero bottom, 1s)
- `.video-modal-enter` — scale + fade (video modal, 0.45s)
- `.video-modal-backdrop-enter` — backdrop fade (0.4s)

### 4. Entrance Animations (Admin)
- `.admin-fade-in` — opacity 0→1 (0.3s)
- `.admin-slide-up` — translateY(8px)→0 + fade (0.3s)
- `.admin-scale-in` — scale(0.95)→1 + fade (0.2s)
- Custom GSAP timelines for modals (`back.out(1.7)` overshoot for content, `power2.out` for backdrop)

### 5. Toast Notifications (Disney 12 Principles)
- **Enter:** Overshoot bounce (`cubic-bezier(0.68, -0.55, 0.27, 1.55)`) — squash & stretch
- **Exit:** Slide right + fade — straight ahead
- **Error shake:** X-axis oscillation — exaggeration
- **Icon:** Delayed follow-through pop
- **Progress bar:** Linear shrink with `transform-origin: left`

### 6. Focus States
All interactive elements must have a visible focus state for accessibility:
```tsx
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red
```

### 7. Reduced Motion
All animations respect `prefers-reduced-motion: reduce` — they are disabled via CSS (see `globals.css`).

---

## Admin Nav Active State

Sidebar nav items use:
```
Active:   bg-brand-red text-white shadow-lg shadow-brand-red/20
Inactive: text-white/50 hover:bg-white/5 hover:text-white
Icons:    group-hover:scale-110 shrink-0
```

---

## Form Elements

**Input fields:**
```tsx
className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30
           outline-none transition-colors focus:border-brand-red/50"
```

**Textareas:** Same as inputs.

**Checkboxes/Radios:** Use `rounded-lg` for multi-select, `rounded-full` for single-select; brand-red accent.

---

## Slicer Text Effect (Hero Signature)

Used on the homepage hero ("GOOD MOOD FOOD") and footer franchise CTA.

```html
<span className="slice-text white-slice" data-text="GOOD">GOOD</span>
<span className="slice-text red-slice" data-text="MOOD">MOOD</span>
```

- `.slice-text` — transparent text with `::before` (top half) and `::after` (bottom half) pseudo-elements
- `.white-slice` — white text, split and skew on hover, red top half
- `.red-slice` — red text, split and skew on hover, white bottom half
- Disabled on `prefers-reduced-motion: reduce`

---

## Skeleton Loading

```tsx
<div className="skeleton rounded-lg h-8 w-full" />
```
- Shimmer animation (`linear-gradient` + `background-position` cycle, 1.5s)
- Background opacity stays within `white/5` → `white/10` range

---

## Guidelines Summary

- **Everything is clickable** — every interactive element must have `cursor-pointer`
- **Every interaction has feedback** — hover, active, and focus states are mandatory
- **No hardcoded colors outside the palette** — use brand tokens and opacity variants
- **No blue, no green** — only black, white, and `#dc2626` (plus green for success toast icons only)
- **No CSS modules, no styled-components** — Tailwind only
- **Uppercase for headings** — `font-display` or `font-teko`, never sentence case for headers
- **GSAP for complex animations** — ScrollTrigger for reveals, timelines for sequenced entrances
- **Lenis for smooth scrolling** — storefront only, wraps entire route group
- **Micro-animations on every button** — hover lift + active scale press

---

## Security Review

**Review date**: July 2026
**Scope**: `client/` — Next.js app (App Router, React 19)
**Methodology**: Manual code review tracing attacker-controlled data paths to DOM sinks and storage.

### Summary

No exploitable client-side vulnerabilities identified. The codebase follows React security best practices: all user-facing data is rendered via JSX interpolation (auto-escaped), no `dangerouslySetInnerHTML` with user-controlled input, no secrets in client-side code, and a centralized fetch wrapper handles all API communication.

### Positive Highlights

| Area | Status |
|---|---|
| XSS (DOM-based) | Mitigated — React auto-escapes `{value}` in JSX. All 5 `dangerouslySetInnerHTML` usages inject hardcoded CSS strings only |
| Secrets exposure | None — no API keys, tokens, or credentials in client source. Only `NEXT_PUBLIC_API_BASE_URL` (a URL, not a secret) |
| Auth token storage | localStorage — standard SPA pattern. No `httpOnly` cookie equivalent available for SPAs |
| Dependency risk | Modern, actively maintained — Next.js 16, React 19, Redux Toolkit, GSAP 3.15. No unmaintained or known-vulnerable packages |
| API communication | Centralized — all calls go through `lib/api.ts`. No ad-hoc `fetch()` calls bypassing auth headers |
| Form data handling | Contact and checkout forms send data via `api.post()` — no direct DOM manipulation of user input |

### Findings

#### [SEC-C001] Admin JWT Stored in `localStorage` (Low)

- **Location**: `lib/api.ts:16`
- **Confidence**: High
- **Issue**: The admin JWT is stored in `localStorage` under key `crispies_admin_token`. It is read on every API request and attached as `Authorization: Bearer` header.
- **Impact**: Low. `localStorage` is accessible to any JavaScript executing on the same origin. If a DOM-XSS vulnerability were introduced, the token could be exfiltrated. However, this is the standard pattern for SPAs — there is no `httpOnly` equivalent for Bearer-token auth. The access token has a 7-day expiry.
- **Note**: This is a design tradeoff inherent to SPA + Bearer token architectures, not a code defect. Mitigations include short token expiry and refresh token rotation (refresh endpoint is not yet implemented on the server — see server SEC note).
- **Status**: ACCEPTED — inherent to SPA architecture. No code change.

#### [SEC-C002] Image Remote Pattern Allowlist (Info)

- **Location**: `next.config.ts:5-8`
- **Confidence**: High
- **Issue**: `next.config.ts` allows images from `images.unsplash.com` and `www.lobikokuzi.us`. The latter is a non-standard domain.
- **Impact**: Low. If the external image host were compromised, a malicious SVG could be served (though Next.js Image component applies sandboxing). This is a standard pattern for external image sources.
- **Fix**: Audit whether `www.lobikokuzi.us` is still an active dependency. Remove unused remote patterns.
- **Status**: RESOLVED — `www.lobikokuzi.us` was not used in any component. Removed from `remotePatterns`.

#### [SEC-C003] Data Mappers Use Unvalidated `as` Casts (Info)

- **Location**: Multiple mapper functions in `lib/admin/*.ts` and `lib/redux/slices/menuSlice.ts`
- **Confidence**: High
- **Issue**: API response data is cast with `as string` / `as number` in mapper functions without runtime validation:
  ```ts
  // lib/admin/use-menu.ts:22
  name: raw.name as string,
  ```
- **Impact**: None. Data flows from Supabase (server-controlled) through the BFF API and is rendered via React JSX interpolation (`{item.name}`). React auto-escapes all text content. If the database were compromised, the injected content would render as escaped text, not executable HTML.
- **Note**: Consider adding Zod runtime validation at the API boundary for defense-in-depth, matching the server-side pattern.
- **Status**: ACCEPTED — impact is None (React auto-escapes), no code change. Adding a full validation layer to all mappers is disproportionate to the risk.

#### [SEC-C004] No Content-Security-Policy Header (Info)

- **Location**: `next.config.ts`
- **Confidence**: High
- **Issue**: `next.config.ts` does not set a `Content-Security-Policy` header. The server uses `helmet()` with defaults, but Next.js rewrites `/api/*` to Express — the HTML pages are served by Next.js which does not inject CSP headers by default.
- **Impact**: None currently (no XSS vulnerabilities exist). CSP would serve as defense-in-depth against future regressions.
- **Fix**: Add CSP via `next.config.ts`:
  ```ts
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' https://images.unsplash.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline';" },
      ],
    },
  ],
  ```
- **Status**: RESOLVED — CSP header added to `next.config.ts` covering all origins (`self`, unsplash, Google video bucket). Explicitly blocks `frame-src` and `object-src`.

### Notes

- **No user-generated content is rendered anywhere** — menu items, deals, and locations are curated by admins via the dashboard. Contact form submissions go directly to the server (no client-side rendering of user messages).
- **Cart is entirely client-side** — stored in Redux (in-memory) with no persistence to `localStorage` or cookies. No cart data is sent to the server except during checkout.
- **All API errors surface as generic messages** — `alert("Something went wrong. Please try again.")` — no stack traces or internal details leaked to users.
