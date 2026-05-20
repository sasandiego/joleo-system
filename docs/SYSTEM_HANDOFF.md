# SYSTEM_HANDOFF

## Last Updated
2026-05-20 — PDF redesign: client-facing quotation with 7 sections, DejaVu Sans for ₱ glyph, 1-page compact layout; ISE debug in progress

## Current System State
Next.js 15.5 app, `pnpm build` clean, `pnpm test` 41/41 green. All Phase 1 milestones (M1–M10) complete and pushed to GitHub (`main`). Full feature set: auth, masterlists CRUD, rate settings, pricing engine, quote builder + PDF, bookings with FSM, truck availability calendar, live dashboard. Login with `jess` / `admin123` (or credentials in `.env.local`).

**Public URL:** `https://joleo.sas-agent.co.uk` (via the existing Nucbox cloudflared tunnel, ID `bda80536-0b37-4881-b1f7-bf2bf6b348ac`). Dev server bound to `*:3000`, accessible via LAN (`192.168.254.166`), Tailscale (`100.87.42.111`), and the public hostname. `NEXTAUTH_URL=https://joleo.sas-agent.co.uk` set in `.env.local` so post-login redirects resolve correctly.

**Phase 1 is complete. Phase 2 (customer-facing portal) is parked.**

PDF quotation route (`/api/quotes/[id]/pdf`) redesigned as a client-facing document this session. Try-catch added to route to surface actual error message; ISE root cause not yet confirmed resolved in Next.js context.

---

## Architecture Snapshot

### App routes (`src/app/`)
- `(auth)/login/page.tsx` — two-column mockup layout, LoginForm client component
- `api/auth/[...nextauth]/route.ts` — Auth.js handlers
- `(admin)/layout.tsx` — grid: 240px Sidebar + main; reads session from auth()
- `(admin)/dashboard/page.tsx` — stub stat card placeholders
- `(admin)/trucks/page.tsx` — trucks list, includes truckType
- `(admin)/drivers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/helpers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/clients/page.tsx` — no Decimal fields
- `(admin)/route-areas/page.tsx` — serializes surcharge/estimatedToll .toNumber()
- `(admin)/rate-settings/page.tsx` — serializes all Decimals + pct × 100 for display
- `(admin)/users/page.tsx` — users list, no Decimals
- `(admin)/quotes/page.tsx` — quotes list, serializes finalPrice .toNumber()
- `(admin)/quotes/new/page.tsx` — loads clients/truckTypes/routeAreas/settings, serializes all Decimals
- `(admin)/quotes/[id]/page.tsx` — quote detail with pricingSnapshot breakdown + Download PDF link
- `(admin)/bookings/page.tsx` — bookings list, includes client/truck/driver/quote
- `(admin)/bookings/new/page.tsx` — standalone booking creation form
- `(admin)/bookings/[id]/page.tsx` — booking detail with assignment form + status transitions
- `(admin)/calendar/page.tsx` — week grid; `?week=YYYY-MM-DD` param; loads trucks + bookings for week
- `(admin)/dashboard/page.tsx` — live stats + today's schedule + Fleet Status card (Active/Under Repair/Inactive via `db.truck.groupBy`) + Recent Quotes card (latest 3) + "+ New Quote" header button + 2-col split layout

### Top-level app files (`src/app/`)
- `icon.png` — 32×32 favicon (generated from `docs/356378784_*.jpg` via sharp + trim)
- `apple-icon.png` — 180×180 Apple touch icon
- `layout.tsx` — Google Fonts CDN `<link>` tags in `<head>` (Fraunces / DM Sans / JetBrains Mono); no `next/font/google` imports
- `globals.css` — CSS vars resolve to literal `'Fraunces'` / `'DM Sans'` / `'JetBrains Mono'`; `.display-font` and `.mono` utility classes added

### Components (`src/components/`)
- `layout/Sidebar.tsx` — nav-dot items, "Transport · Admin", active state via usePathname
- `layout/PageHeader.tsx` — reusable page header
- `auth/LoginForm.tsx` — useActionState + useFormStatus
- `users/ResetPasswordDialog.tsx` — Radix Dialog
- `trucks/`, `drivers/`, `helpers/`, `clients/`, `route-areas/` — ListClient + Dialog per entity
- `rate-settings/RateSettingsForm.tsx` — full settings form + change log dialog
- `quotes/QuoteListClient.tsx` — quotes table with status badges
- `quotes/QuoteBuilderForm.tsx` — client component: useState all fields, useMemo live pricing
- `quotes/PriceBreakdownPanel.tsx` — live breakdown panel: line items + tier grid + warnings
- `pdf/QuotationPDF.tsx` — @react-pdf/renderer A4 document
- `bookings/BookingListClient.tsx` — filterable bookings table (search, status, date)
- `bookings/BookingDetailClient.tsx` — assignment form + FSM status transitions
- `bookings/NewBookingForm.tsx` — standalone booking creation
- `bookings/TruckCalendar.tsx` — week grid with booking blocks and unavailable stripes

### Actions (`src/actions/`)
- `auth.ts` — loginAction, signOutAction
- `users.ts` — resetPasswordAction
- `trucks.ts`, `drivers.ts`, `helpers.ts`, `clients.ts`, `route-areas.ts` — upsert actions
- `rate-settings.ts` — updateRateSettingsAction (AuditLog with before/after)
- `quotes.ts` — saveQuoteAction (QT number gen, computePrice, Quote + optional Booking creation)
- `bookings.ts` — transitionBookingAction (FSM + conflict check + audit), updateBookingAssignmentAction, createBookingAction

### Features
- `src/features/auth/config.edge.ts` — edge-safe NextAuth config (no Prisma)
- `src/features/auth/config.ts` — full NextAuth config with bcryptjs + Prisma
- `src/features/pricing/types.ts` — PricingInput, PricingContext, PricingResult, LineItem, PricingWarning
- `src/features/pricing/engine.ts` — pure `computePrice(input, ctx): PricingResult`
- `src/features/pricing/engine.test.ts` — 8 test cases, 41 assertions
- `src/features/booking/state-machine.ts` — DRAFT→QUOTED→CONFIRMED→DISPATCHED→COMPLETED / CANCELLED FSM

### Lib
- `src/lib/db.ts`, `env.ts`, `format.ts`, `utils.ts`
- `src/middleware.ts` — auth guard via edge config; matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `icon.png`, `apple-icon.png`
- `src/types/next-auth.d.ts` — session/user/JWT type augmentation

### Schema models
- User, TruckType, Truck, Driver, Helper, Client, RouteArea, RateSettings — all seeded
- Quote, Booking, BookingHelper, AuditLog — schema ready, not yet used in UI

---

## Key Decisions

### Decision: Pricing engine — pure function, corrected Excel
- Engine lives at `src/features/pricing/engine.ts` — no DB access, no side effects
- Caller resolves `RateSettings` + `TruckType` from DB and passes them in
- Pct fields in DB are fractions (0.05 = 5%) — engine receives raw fractions, do NOT ×100
- Excel had broken cell refs for steps 1 (truck base rate) and 16 (maintenance) — both showed 0
- Our engine INCLUDES both — corrected V6 reference: 100km, 2 helpers, condo, outOfTown → **₱18,532** (not ₱11,209.60)
- Do NOT change formula unless business explicitly requests the Excel's broken behavior

### Decision: Engine context uses structural interfaces, not Prisma types
- `TruckTypeForPricing` and `RateSettingsForPricing` use `{ toNumber(): number }` for Decimal fields
- Prisma objects satisfy these interfaces directly — no `.toNumber()` conversion at call site
- Test objects: `new Decimal(value)` satisfies the interface

### Decision: No backup service in Phase 1
- Deferred; 4-container stack only (postgres/web/caddy/cloudflared)

### Decision: Quote/Booking number format
- QT-YYYYMMDD-NNNN / JOL-YYYYMMDD-NNNN — daily sequence, Asia/Manila TZ
- Sequence resets to 0001 each calendar day

### Decision: Tailwind v4 CSS-based config
- Brand tokens in @theme in globals.css — no tailwind.config.js ever

### Decision: Auth.js v5 split config
- `config.edge.ts` (no Prisma) for middleware, `config.ts` for API + server components

### Decision: Rate Settings pct field convention
- Stored as fractions: 0.05 = 5%. Page ×100 for display; action ÷100 before save
- Engine receives raw fractions directly from DB

### Decision: Decimal serialization at server/client boundary
- Call `.toNumber()` in server page components before passing as props
- Applies to: Driver, Helper, RouteArea, RateSettings Decimal fields

### Decision: Fonts via Google Fonts CDN, not next/font (2026-05-20)
- Replaced `next/font/google` with literal `<link>` tags in `src/app/layout.tsx`, matching `build-guide/joleo_mockup.html` exactly
- User directive: *"Do not substitute fonts. Match the Joleo mockup exactly."*
- `globals.css` CSS vars now resolve to literal `'Fraunces'`, `'DM Sans'`, `'JetBrains Mono'`
- `.display-font` and `.mono` utility classes added per mockup convention
- Do NOT migrate back to `next/font` without explicit user confirmation, even for performance reasons

### Decision: Public access via existing cloudflared tunnel (2026-05-20)
- Reused the Nucbox's `aplaya` tunnel (ID `bda80536-0b37-4881-b1f7-bf2bf6b348ac`) rather than spinning up a new tunnel
- Added `joleo.sas-agent.co.uk` ingress (above the catch-all 404) → `http://localhost:3000` in `/etc/cloudflared/config.yml`
- The CNAME for the sas-agent.co.uk zone was added via the Cloudflare dashboard, because cloudflared's `~/.cloudflared/cert.pem` on the Nucbox is only authorized for the aplaya-dev.cc zone
- Do NOT touch the other ingress entries (`aplaya-dev.cc`, `n8n.sas-agent.co.uk`, etc.) — they serve other projects on the same Nucbox

### Decision: DejaVu Sans for ₱ glyph in PDFs (2026-05-20)
- Helvetica (built-in PDF font), Roboto, and Noto Sans Latin subsets all lack U+20B1 (₱ Philippine Peso Sign) — renders as overlapping characters
- DejaVu Sans Regular (confirmed via byte search) includes U+20B1; DejaVu Sans Bold does NOT
- TTFs copied from Nucbox system fonts to `public/fonts/DejaVuSans.ttf` and `public/fonts/DejaVuSans-Bold.ttf`
- Registered via `path.resolve(process.cwd(), "public/fonts/...")` in `Font.register()` — do NOT use URLs or absolute system paths
- All monetary amount strings in `QuotationPDF.tsx` use Regular weight; labels/headings use Bold (fontWeight 700)
- Do NOT swap to another font without first confirming U+20B1 is present in the TTF binary

### Decision: Explicit `import React` in QuotationPDF.tsx (2026-05-20)
- @react-pdf/renderer v4 uses a custom fiber reconciler that calls component functions in a context where Next.js's automatic JSX transform does not inject React
- Symptom: `ReferenceError: React is not defined` at runtime in both Next.js and tsx test contexts
- Fix: `import React from "react"` must remain at the top of `QuotationPDF.tsx` — do NOT remove it even though Next.js 15 uses the automatic JSX transform everywhere else

### Decision: Favicons from truck logo (2026-05-20)
- Source: `docs/356378784_599377255674979_8027307442482878578_n.jpg` (truck silhouette + "JOLEO TRANSPORT" wordmark)
- Generated via `sharp().trim()` (removes white border) then `.resize()` to 32×32 and 180×180
- Files: `src/app/icon.png`, `src/app/apple-icon.png` (Next.js App Router auto-wires both)
- To regenerate: write a one-shot mjs script that imports sharp from its absolute pnpm path (`node_modules/.pnpm/sharp@*/node_modules/sharp/lib/index.js`)

---

## Active Gotchas
- Tailwind v4: `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` in postcss.config.mjs
- Auth.js v5: `next-auth@beta`; `AUTH_TRUST_HOST=true` AND `NEXTAUTH_URL=https://joleo.sas-agent.co.uk` in .env.local (the latter is needed so post-login callbacks resolve to the public hostname, not localhost)
- `jose` v6 Edge Runtime CompressionStream warnings — harmless, known upstream issue
- `env.ts` validates at startup — missing required var = app won't start
- Sidebar uses inline styles for SSR brand var consistency
- All Dialogs use `@radix-ui/react-dialog` — already installed
- `decimal.js` already installed — use it for all currency math
- `middleware.ts` matcher MUST exclude any top-level app-root icon files (`icon.png`, `apple-icon.png`), otherwise the auth guard 307-redirects them and the favicon never loads
- pnpm 11 requires `allowBuilds:` in `pnpm-workspace.yaml` with **booleans**, not the placeholder strings pnpm sometimes auto-writes. Without booleans, Prisma/sharp/esbuild postinstall scripts are skipped (`[ERR_PNPM_IGNORED_BUILDS]`)
- cloudflared cert.pem on the Nucbox is only authorized for the aplaya-dev.cc zone. For sas-agent.co.uk records (or any other zone), create the CNAME via the Cloudflare dashboard manually — do NOT rely on `cloudflared tunnel route dns`
- sudo on the Nucbox needs a real TTY. Claude Code's Bash tool and `!`-prefixed commands cannot prompt for the password; the user must run sudo from a separate terminal (or `ssh agent@nucbox`)

---

## Session Continuity (2026-05-20)
- Last worked on: PDF redesign — client-facing 7-section layout, DejaVu Sans ₱ fix, 1-page compact grid, explicit React import, try-catch error logging in PDF route
- **Immediate next step:** user to attempt PDF download and share the error text returned by try-catch; fix the ISE root cause once the actual error is known
- **Blocked:** PDF ISE not confirmed resolved in Next.js context — tsx render test passes (27 KB), but browser still returns 500; try-catch is in place ready to surface the message
- Do NOT touch:
  - `/etc/cloudflared/config.yml` and other ingress entries on the Nucbox (serve other projects)
  - Font system (must stay on Google Fonts CDN per user directive)
  - Dashboard layout (mockup-exact intentional)
  - `pnpm-workspace.yaml` `allowBuilds:` booleans (needed for postinstall scripts)
  - `import React from "react"` in `QuotationPDF.tsx` (required by @react-pdf/renderer reconciler)
  - DejaVu font files in `public/fonts/` (only confirmed fonts with U+20B1)

---

## Reference: M6 Quote Builder Details (archived)

### What M6 delivers
1. `/quotes` — list page (quoteNo, client, status, amount, date, actions)
2. `/quotes/new` — two-column builder: form left, live `PriceBreakdownPanel` right
3. Save as draft action → writes Quote row with `pricingSnapshot` JSON
4. PDF generation via `@react-pdf/renderer` at `/api/quotes/[id]/pdf`
5. "Convert to Booking" action → creates Booking from Quote

### Files to create
- `src/app/(admin)/quotes/page.tsx` — server component, quotes list
- `src/app/(admin)/quotes/new/page.tsx` — server component, loads clients + truck types + rate settings + route areas
- `src/app/(admin)/quotes/[id]/page.tsx` — quote detail / view
- `src/components/quotes/QuoteBuilderForm.tsx` — client component form
- `src/components/quotes/PriceBreakdownPanel.tsx` — client component, recomputes on every change
- `src/components/quotes/QuoteListClient.tsx` — client component list
- `src/components/pdf/QuotationPDF.tsx` — @react-pdf/renderer document
- `src/app/api/quotes/[id]/pdf/route.ts` — PDF download route
- `src/actions/quotes.ts` — saveQuoteAction, convertToBookingAction

### Quote number generation
```typescript
// QT-YYYYMMDD-NNNN — daily sequence reset, Asia/Manila TZ
// In saveQuoteAction:
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }).replace(/-/g, "");
const count = await db.quote.count({ where: { quoteNo: { startsWith: `QT-${today}-` } } });
const quoteNo = `QT-${today}-${String(count + 1).padStart(4, "0")}`;
```

### Live pricing recompute pattern
- `QuoteBuilderForm` holds all form state in `useState`
- On every field change → call a client-side `recomputePrice()` function
- `recomputePrice()` calls `computePrice(input, ctx)` directly (imported from engine)
- Context (truckTypes, settings) passed as props from the server page
- No server round-trip for price preview — all client-side Decimal.js computation

### pricingSnapshot shape
- Stored as JSON in `Quote.pricingSnapshot`
- Full `PricingResult` object — includes `rateSnapshot` (copy of settings used) and `inputsSnapshot`

### Key schema fields for Quote
- `quoteNo` String unique
- `status` String ("DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED")
- `clientId` + `walkInName` — one or the other
- `pricingSnapshot` Json — full PricingResult at time of save
- `finalPrice` Decimal — targetPrice from engine
- `manualOverridePrice` Decimal? — if admin overrides
- `createdById` String — from session.user.id
