# Crispies — Client Design Guide

## Brand Identity

Crispies is a London-based halal fast-food brand (burgers + chicken). The visual identity is **dark, bold, and premium** — black canvas with high-contrast red accents, cinematic imagery, and kinetic typography.

**Tagline:** "Good mood food."
**Voice:** Bold, direct, youthful, London-rooted.

---

## Color System

The storefront and admin share the brand tokens defined in `client/app/globals.css`.
The tokens were updated to the new Crispies palette. Until "the rest" (admin)
is migrated, admin still renders with `bg-red-700` hover and its existing
`#dc2626`-era button recipes — see the Admin section below.

| Token | Value | Usage |
|---|---|---|
| `--color-brand-black` / `bg-brand-black` | `#000000cc` (80% black) | Primary surface — used for page wrappers, header/footer, overlays |
| `--color-brand-white` / `text-white` | `#ffffff` | Primary text color |
| `--color-brand-red` / `bg-brand-red` / `text-brand-red` | `#ff0931` | Accent — CTAs, highlights, active states, focus outlines |
| `white/5` | `rgba(255,255,255,0.05)` | Subtle card/button backgrounds |
| `white/10` | `rgba(255,255,255,0.10)` | Borders, dividers, muted surfaces |
| `white/20` | `rgba(255,255,255,0.20)` | Secondary borders, ghost button borders |
| `white/30` | `rgba(255,255,255,0.30)` | Muted text, placeholder borders |
| `white/40` | `rgba(255,255,255,0.40)` | Secondary body text |
| `white/50` | `rgba(255,255,255,0.50)` | Muted labels, non-active nav items |
| `white/60` | `rgba(255,255,255,0.60)` | Default nav link color |
| `white/70` | `rgba(255,255,255,0.70)` | Secondary subdued text |
| `bg-red-700` | `#b91c1c` | Admin-only button hover (to be migrated last) |
| `green-400/500` | success toasts | Icon theme for success |

**Storefront-only colors** (used in the homepage sections — see Storefront Sections):

| Color | Hex | Usage |
|---|---|---|
| Dark red panel | `#C1001F` | Order card inner panels (Download App / Get It Delivered) |
| Navbar vertical divider | `#434343` | Desktop navbar divider (literal, navbar only) |
| Dark map surface | `#1A1A1A` | Locations map card bg with radial gradients (`#2a2a2a`/`#252525`/`#1f1f1f` → `#141414`) |
| Dark icon tile | `#1E1E1E` | Stats seam icon tile |
| Status pill (open, active) | `#1F5C2E` bg / `#7CFF8A` dot | Locations "Open Now" pill |
| Status pill (open, muted) | `#6FA06A` bg / `#C8F0C0` dot | Locations muted-open pill |
| Status pill (closed) | `#8B6F5E` bg / `#C9A892` dot | Locations "Close Now" pill (brown) |
| Location row grays | `#9A9A9A`/`#B0B0B0`/`#BDBDBD`/`#C4C4C4`/`#D0D0D0` | Locations list number/name/address/hours tints |
| White-section borders | `#EAEAEA` | Locations row dividers |
| Row borders (bg-white sections) | `border-black/5`-ish `#EDEDED` | Use `border-[#EAEAEA]` for white-bg rows |

> Note: the "no green" rule has **exceptions** on the Locations section — the status pills are intentionally green/brown for at-a-glance open/closed semantics. The rest of the storefront stays strictly black/white/red.

**Rules:**
- The `<body>` is backed by **solid black** `#000000` so `bg-brand-black`
  (`#000000cc`) reads true-black over it while still allowing subtle
  image/content show-through for overlays, headers, and video scrims.
- Page-level sections that need true black use `bg-black`; ambient/overlay
  surfaces use `bg-brand-black`.
- Text is **white** or **brand-red**. Never use gray text — use opacity
  (`text-white/XX`) for hierarchy.
- Red is the **only accent color**. No blue, no green (except toast icons),
  no yellow.
- Borders use `border-white/10` by default, `border-brand-red` for
  active/focused states.

### Hex reference

Use these exact hex values when a raw color is needed (inline styles, SVG
fills, `shadow-[...]` arg, toast icon themes, JSON-LD, etc.):

| Role | Hex |
|---|---|
| Primary background (solid) | `#000000` |
| Primary surface / overlay (80%) | `#000000cc` |
| Text | `#ffffff` |
| Accent | `#ff0931` |
| Accent shadow glow (for `shadow-[...]`) | `rgba(255,9,49,0.4)` / `rgba(255,9,49,0.7)` |
| Accent focus ring | `rgba(255,9,49,0.15)` |
| Navbar vertical divider | `#434343` (literal, navbar only) |

---

## Typography

| Role | Font | CSS Variable | Where Used |
|---|---|---|---|
| Section / display headings | **Bebas Neue** | `--font-bebas` | Menu items, Stats numbers, Locations list, Footer headings (`font-display`) |
| Hero-ribbon + big headlines | **Koulen** | `--font-koulen` | Hero ribbon, About ("Welcome To Crispies"), Order section, Partner, Navbar links |
| Body text, UI labels | **Plus Jakarta Sans** | `--font-jakarta` | `font-sans` — default body font |
| Navbar buttons / small UI | **Inter** | `--font-inter` | Navbar buttons, stat labels, locations meta (address/hours/status), footer links, mobile menu toggle |
| Partner subcopy | **Poppins** | `--font-poppins` | Partner section intro copy |
| Preloader wordmark | **Oswald** | `--font-oswald` | `[family-name:var(--font-oswald)]` — preloader only |
| Legacy hero mega-headline | **Teko** | `--font-teko` | `font-teko` — defined but **not used** by the current homepage (old "GOOD MOOD FOOD" headline) |

All **seven** fonts are loaded in `client/app/layout.tsx` via `next/font/google` (Bebas, Oswald, Jakarta, Teko, Koulen, Inter, Poppins) and their CSS variables are wired onto `<html>`.

**Sizing patterns (all fluid via `clamp()`):**
- Hero ribbon: `clamp(22px, 7vw, 130px)`, Koulen, `leading-[100%]`, `tracking-[0.54px]`
- Section headlines: `clamp(36px, 7vw, 80px)` → `clamp(48px, 10vw, 150px)`, `leading-[100%]`, `tracking-[0.54px]`
- Menu category items: `clamp(22px, 6vw, 140px)`, Bebas, `leading-[110%]`
- Stats numbers: `clamp(36px, 7vw, 72px)`, Bebas; stat labels `clamp(10px, 1.4vw, 14px)`, Inter, uppercase, `tracking-[0.12em]`
- Nav links/buttons: **`text-[15px]`**, `capitalize`, `tracking-[0.54px]` (Koulen links, Inter buttons)
- Body copy: `text-[13px]` → `text-white/50`
- Labels/kickers: `text-[9px]` → `text-[11px]`, uppercase, `tracking-[0.3em]`, `text-white/40`
- Admin headings: `font-display text-xl tracking-wide`
- Admin body: `text-sm`

**Rules:**
- All headings are uppercase unless specified.
- `tracking-[0.54px]` on all Koulen/Bebas display copy, `tracking-[0.02em]` on Bebas headlines, `tracking-[0.04em]`–`[0.12em]` on labels.
- Bebas = section display; Koulen = mega-display + navbar links; Inter = buttons/labels/meta; Poppins = partner subcopy only.
- Teko is legacy — do not add new usage.
- Fonts are applied via `fontFamily: "var(--font-x), X, sans-serif"` inline style, not Tailwind utility classes (except `font-display`/`font-sans`).

---

## Layout

### Storefront
- **Canvas:** `min-h-screen bg-brand-black text-white` (wraps whole storefront), `<body>` solid black `#000000`
- **Section rhythm:** alternates **black (navbar/hero/footer)** → **white (About/Menu/Locations)** → **red (`#FF0931`) (Order/Stats/Partner)** with negative-margin overlaps (`-mt-[90px] md:-mt-[140px]`) and large bottom radii (`rounded-b-[40px…60px]`) creating interlocking blocks
- **Max width:** `max-w-[1280px]` / `max-w-[1400px]` with responsive padding (`px-5 sm:px-6 xl:px-10`, navbar `px-6 xl:px-10`)
- **Footer:** Full-width `bg-black` with `h-[3px] bg-[#FF0931]` top line and `border-t border-white/10` bottom bar
- **No scrollbar** — `scrollbar-width: none` in `globals.css` (custom progress indicator)

### Navbar (`client/components/store/navbar.tsx`)
The navbar is **not** fixed — it renders as a `relative z-50` `<header>` in normal flow with a solid `bg-black` background, so it never needs the old transparent→backdrop-blur scroll transition. It has two distinct rows plus a dropdown panel.

**Desktop (`lg:flex` and up):**
- Wrapper: `mx-auto w-full max-w-[1422px] py-10 px-6 xl:px-10` — items vertically centered (`items-center`), space-between.
- Logo: left, `h-[124px] w-[124px] shrink-0` (`object-contain`), links to `/`.
- Right cluster: `flex items-center gap-6 xl:gap-8`, containing:
  - Nav links (`menu`, `locations`) — `link-underline` + `navItemClass`: `text-white text-[15px] font-normal capitalize tracking-[0.54px] [font-family:var(--font-koulen)]`, `transition-colors duration-200 hover:text-[#FF0931]`.
  - Divider: `h-14 w-px shrink-0 bg-[#434343]` (literal `#434343`, not a token — keep it literal).
  - **Order In The App** button (primary): `btn-press px-7 py-3 rounded-[4px] bg-[#FF0931] text-white text-[15px] font-semibold capitalize tracking-[0.54px] [font-family:var(--font-inter)]`.
  - **Delivery** button (outline): `btn-press px-7 py-3 rounded-[4px] border border-[#FF0931] text-[#FF0931] text-[15px] font-semibold capitalize tracking-[0.54px] [font-family:var(--font-inter)]`.

**Mobile (`lg:hidden`):**
- Top bar: `flex h-16 items-center justify-between px-5`.
- Logo: `56×56`, links to `/`.
- Right cluster: `flex items-center gap-2` — a compact Delivery button (`px-3 py-2 text-[12px]`, same outline recipe) and a text **Menu/Close** toggle (`px-3 py-2 text-[13px] font-semibold capitalize tracking-[0.54px] text-white`, Inter).
- Menu open: `fixed inset-0 top-16 bg-black/60` backdrop (`backdrop-in`) + absolute dropdown `absolute inset-x-0 top-full border-b border-white/10 bg-black` (`menu-drop`).
  - Inner list: `flex flex-col gap-1 px-5 py-6`. Links get an extra `rounded-md px-4 py-4 hover:bg-white/5` and staggered `animationDelay` via inline style (`0.05 + i*0.08`s). The two CTA buttons repeat the desktop recipe with `px-7 py-4`, also staggered.
- Body scroll lock: when the menu is open, `document.body.style.overflow = "hidden"` is set (cleared on close / unmount).

**Animations (defined in `globals.css`):** `.nav-enter` (desktop drop-in, 0.55s `cubic-bezier(0.16,1,0.3,1)`), `.menu-drop` (panel, 0.3s), `.menu-item` (link/button float-up, 0.45s), `.backdrop-in` (0.3s) — all disabled under `prefers-reduced-motion: reduce`.

---

## Storefront Main Page — Section Specs

Composition of `client/app/page.tsx` (all 9 components). Every section is full-bleed width.

### 1. Hero (`components/store/hero.tsx` + `hero.module.css`)
- **Theme:** black page, full-bleed image (`/images/heroimage.png`), `aspect-video` → `md:h-[80vh]`, `rounded-[20px]`
- **Signature element:** red notch ribbon — `clip-path` polygon (8 points) via CSS custom props (`--notch` `clamp(32px,5vw,65.88px)`, `--tip` `clamp(54px,8vw,109px)`), `bg-[#FF0931]`, `absolute inset-x-0 bottom-5`
- **Copy:** Koulen, white, `clamp(22px, 7vw, 130px)`, "Always Good Mood Food"
- **Micro-animation:** none on section itself; ribbon is static (entrance handled by page-level scroll)

### 2. About (`components/store/about.tsx` + `about.module.css`)
- **Theme:** **white** section pulled up over the hero via `-mt-[90px] md:-mt-[140px]`, `rounded` overlap effect
- **Copy:** Koulen black "Welcome To **Crispies**" (`#FF0931` span), `clamp(48px,10vw,150px)`; subcopy Koulen black `clamp(24px,4vw,60px)`
- **Image carousel:** center sharp image (`rounded-[32px]` → `lg:rounded-[66px]`, `sm:h-[360px]` → `lg:h-[520px]`) flanked by absolute blurred mirrors (`opacity-60 blur-[4px]`, `rounded-[28px]` → `lg:rounded-[40px]`), positioned via `right/left: calc(50% + 20px/40px)` — side images sit half-off-screen on desktop, hidden behind the center on mobile
- **Responsive:** center image scales `200px` → `520px` across `sm/md/lg`; side images `h-[160px]` mobile → `lg:h-[360px]`

### 3. Order (`components/store/order.tsx`)
- **Theme:** full-width `bg-[#FF0931]`, inner overlap (`-mt-[90px] md:-mt-[140px]`, `pt-[140px] md:pt-[180px]`)
- **Copy:** Koulen white "Order Crispies" + Koulen black "Choose Your Way" (both `clamp(36px,10vw,150px)`); subcopy Koulen white `clamp(18px,4vw,60px)`
- **3 cards** (staggered bottom edges, `rounded-b-[50px]` on outer, `lg:flex-row lg:items-end`):
  1. **Download Our App** — white frame + red panel + **`#C1001F` inner card**, white Koulen title `text-5xl lg:text-7xl`, Inter white subcopy, red icon square (rounded, arrow SVG) pinned bottom-left, app image absolute bottom-right (`h-[220px]` → `lg:h-[350px]`)
  2. **Order On The Website** — white card, red Koulen title + black Koulen title, Inter black subcopy, red icon square top-right, phone image centered-bottom
  3. **Get It Delivered** — same recipe as #1 mirrored (title white, red icon bottom-left, delivery image bottom-right)
- **Sizing:** cards `h-[380px] w-full sm:w-[420px]` → `lg:w-[480px] lg:h-[480px]` → `2xl:w-[530px] 2xl:h-[530px]`; stacked `flex-col` with `gap-10` on mobile, row on `lg`
- **Micro-animation:** card images `object-bottom` crop so they "sit" on the panel; no JS animation

### 4. Menu (`components/store/menu.tsx`)
- **Theme:** **white**, `py-16 md:py-24 lg:py-28`, max `1280px`
- **Copy:** 16 hardcoded categories split into two Bebas columns (`clamp(22px, 6vw, 140px)`, `#000000`, `leading-[110%]`, `capitalize`), `text-center md:text-left`
- **Hover micro-animation (GSAP, `useLayoutEffect`):**
  - Non-hovered items: `opacity 0.12`, `blur(2.5px)`, black (0.35s `power2.out`, stagger 0.02)
  - Hovered item: full opacity, `blur(0)`, turns **`#FF0931`**, shifts toward center column (`x: ±12`)
  - Floating image (`hidden lg:block`, `300px`/`340px`): GSAP-animated to the hovered item's x/y (clamped inside container), `power3.out`, plus infinite bobbing `y: -7` loop (`sine.inOut`, 1.1s yoyo)
  - Images preloaded in a hidden `<div>` so hover swaps are instant
- **Responsive:** two columns always; floating image desktop-only (`lg+`)

### 5. Stats (`components/store/stats.tsx`)
- **Theme:** white bg + red block (`rounded-b-[40px] sm:[50px] md:[60px]`, `pt-[90px]…110px pb-[56px]…72px`)
- **Seam icon:** absolute SVG (dark `#1E1E1E` tile, white + `#E21E2F` chicken illustration) straddling the white/red seam at `-top-[50px]…55px`
- **Copy:** Bebas white "Good Food, No Compromise" `clamp(32px,6.5vw,72px)`; three stats (10+ / 100% / 12K+) — Bebas numbers `clamp(36px,7vw,72px)` + Inter white uppercase labels `clamp(10px,1.4vw,14px)` `tracking-[0.12em]`
- **Responsive:** stats row `gap-6 sm:gap-12 md:gap-20 lg:gap-28`, always `flex-row`, `flex-wrap`-free (numbers shrink via clamp)

### 6. Locations (`components/store/locations.tsx`)
- **Theme:** **white**, `py-16 sm:py-20 md:py-24 lg:py-28`, max `1280px`
- **Copy:** Bebas "Find Your **Nearest Crispies**" — black + `#FF0931` spans, `clamp(36px,7vw,80px)`
- **List rows** (`loc-row`): `border-b border-[#EAEAEA]`, columns = Bebas number + Bebas name + Inter address + status pill + Inter hours + red arrow button; grays tint per tone (`active` vs `muted`)
- **List micro-animation (CSS in `globals.css`):** `.loc-list:hover .loc-row:not(:hover)` → `opacity 0.15` + `blur(2.5px)` (0.35s); hovered row → number/name/address/hours turn `#FF0931` (`.loc-hover-red`) and whole row slides `translateX(6px)` (`.loc-slide`)
- **Status pill:** rounded-full, colored bg + colored dot (green open / brown closed — see Colors); red arrow button `hover:bg-[#FF0931] hover:text-white`
- **"View All 10+ Location" CTA:** full-width `bg-[#FF0931] hover:bg-[#E0082C]` bar with Bebas white label + white icon square (`rounded-[10px…12px]`) with red arrow
- **Map card (right, `lg:w-[340px] xl:w-[380px]`):** `bg-[#1A1A1A]` + radial-gradient texture, SVG road strokes (`#2e2e2e`–`#3a3a3a`), area labels (`#5A5A5A`, Inter, uppercase `tracking-[0.18em]`), red pins (white-bordered circles + triangle tail), red bottom banner "More Location Coming Soon"
- **Responsive:** rows stack (`flex-wrap`, reordered via `order-2/3/4/5`) on mobile; map card goes full-width below `lg`, `min-h-[420px]` → `min-h-full`

### 7. Partner (`components/store/partner.tsx`)
- **Theme:** full-width **`bg-[#FF0931]`**, max `1400px`, `py-14 sm:py-16 md:py-20 lg:py-24`
- **Copy:** Koulen white "Bring Crispies to your city." `clamp(36px,7vw,80px)`; Poppins white subcopy `clamp(14px,1.7vw,20px)`
- **CTA:** full-width `max-w-[992px]` **black** bar (`hover:bg-[#111]`) with Koulen white label + white icon square + red arrow glyph (ArrowIcon SVG `#FF0000`)
- **Image:** right column (`lg:w-[46%]`), `aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3.4]`, `rounded-[20px…28px]`
- **Responsive:** `flex-col` → `lg:flex-row`, copy stacks above image on mobile

### 8. Footer (`components/store/footer.tsx`)
- **Theme:** `bg-black`, red top hairline `h-[3px] bg-[#FF0931]`, max `1280px`
- **4-column grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, column dividers `lg:border-r lg:border-white/10`):
  - Logo: white rounded tile (`bg-white rounded-[4px]`, `w-[120px]…140px`) with `hover:scale-[1.04]`
  - **Quick Links** / **Get In Touch** / **Follow Us On Socials**: Bebas red headings `clamp(18px,2vw,22px)` + Inter `text-white/80` links `clamp(14px,1.4vw,16px)`
- **Micro-animations:** links `hover:text-white` + `hover:translate-x-1` (quick links) or color-only; social circles (`w-8 h-8 rounded-full border-white/40`) `hover:border-[#FF0931] hover:bg-[#FF0931] hover:scale-110`
- **Bottom bar:** `border-t border-white/10 py-5`, Inter `text-white/50` copyright

### 9. Storefront layout wrapper (`app/(store)/layout.tsx`)
- `SmoothScroll` (Lenis) wraps everything; `Toaster` themed `#000000cc` bg / white text / `border-white/10` / `rounded-full` / success+error icons `#FF0931`
- Selection color: `selection:bg-brand-red selection:text-white`

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

**Storefront CTA bar (red, full-width):**
```tsx
className="w-full flex items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px] bg-[#FF0931]
           hover:bg-[#E0082C] transition-colors duration-200 pl-6 sm:pl-8 pr-3 sm:pr-3.5 py-3 sm:py-3.5 text-white"
```
Left label: Bebas uppercase `clamp(22px, 2.8vw, 32px)`; right: white icon square `w-10 h-10 rounded-[10px] sm:rounded-[12px]` with red arrow.

**Storefront CTA bar (black, on red section — Partner):**
```tsx
className="w-full max-w-[992px] flex items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px]
           bg-black hover:bg-[#111] transition-colors duration-200 pl-6 sm:pl-8 md:pl-10 pr-3 sm:pr-4 py-4 sm:py-5"
```

**Storefront square CTAs (navbar):**
```tsx
className="rounded-[4px] px-7 py-3 text-[15px] font-semibold capitalize tracking-[0.54px]
           [font-family:var(--font-inter),Inter,sans-serif]" + btn-press
```
Primary: `bg-[#FF0931] text-white`; Outline: `border border-[#FF0931] text-[#FF0931]`.

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
CSS animation classes available in `globals.css`:
- `.nav-enter` — desktop navbar drop-in (0.55s `cubic-bezier(0.16,1,0.3,1)`)
- `.menu-drop` — mobile menu panel (0.3s)
- `.menu-item` — mobile menu links/buttons staggered float-up (0.45s, delay via inline `animationDelay`)
- `.backdrop-in` — mobile menu backdrop fade (0.3s)

GSAP (`gsap.to` / `fromTo` in `useLayoutEffect`) is used for the Menu section hover choreography (blur/dim siblings, highlight hovered item, floating image follow + bob) — see Section Specs #4.

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

## Slicer Text Effect (Legacy)

**No longer used on the current homepage.** The hero was rebuilt as the red notch-ribbon ("Always Good Mood Food", Koulen). The effect still exists for reference / future use (e.g. footers or CTA blocks):

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

## Responsiveness

The storefront is fully responsive with Tailwind breakpoints (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`) + fluid typography.

**Fluid type (`clamp()` everywhere):** every headline/number uses `clamp(min, vw-based, max)` (e.g. `clamp(22px, 7vw, 130px)`) so text scales continuously — no discrete font-size jumps.

**Per-section behavior:**
| Section | Mobile | lg+ |
|---|---|---|
| Hero | `aspect-video`, `rounded-[20px]` | `md:h-[80vh]` |
| About | side images hidden (pushed off), center 220px | 520px center, blurred mirrors half-off-screen (`right/left: calc(50% + 40px)`) |
| Order | cards stacked `flex-col gap-10`, `w-full` | `lg:flex-row lg:items-end`, fixed card widths (`lg:w-[480px]`, `2xl:w-[530px]`) |
| Menu | two columns always; no floating image | floating hover image appears (`lg:block`) |
| Stats | numbers shrink via clamp, `gap-6` | `lg:gap-28` spread |
| Locations | rows wrap + reorder (`order-2/3/4/5`), map card full-width below list | `lg:flex-row`, map `w-[340px] xl:w-[380px]` |
| Partner | copy stacks above image | `lg:flex-row`, image `lg:w-[46%]` |
| Footer | `grid-cols-1` → `sm:grid-cols-2` | `lg:grid-cols-4` with `lg:border-r` dividers |
| Navbar | text Menu/Close toggle + compact Delivery btn, slide-down panel | full link row `lg:flex` |

**Containers:** `max-w-[1280px]` (Menu/Locations/Footer), `max-w-[1400px]` (Partner), navbar `max-w-[1422px]`; padding scale `px-5 sm:px-6 xl:px-10` (sections) / `px-6 xl:px-10` (hero/navbar).

**Reduced motion:** `prefers-reduced-motion: reduce` kills nav/menu/toast/loc-row/burger transitions in `globals.css`.

---

## Guidelines Summary

- **Everything is clickable** — every interactive element must have `cursor-pointer`
- **Every interaction has feedback** — hover, active, and focus states are mandatory
- **No hardcoded colors outside the palette** — use brand tokens and opacity variants
- **No blue** — black (`#000000` / `#000000cc`), white (`#ffffff`), `#ff0931` (+ `#C1001F` order panels). Green is **only** allowed in Locations status pills and success toast icons
- **No CSS modules, no styled-components** — Tailwind only. *(Exceptions: `hero.module.css` ribbon clip-path and `about.module.css` side-image positioning — kept local because they are section-specific geometry)*
- **Uppercase for headings** — Bebas or Koulen, never sentence case for headers
- **GSAP for complex animations** — Menu hover choreography, timelines for sequenced entrances
- **Lenis for smooth scrolling** — storefront only, wraps entire route group
- **Micro-animations on every button** — hover lift + active scale press
- **Fluid typography** — all display sizes via `clamp()`

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
