# SYSTEM_HANDOFF

## Last Updated
2026-05-22 — 6-phase pricing engine refactor complete: new BillingType, bottom-up revenue formula, Pricing Config UI, Quote Builder/Editor updates, PDF cleanup, migration applied

## Current System State
Next.js 15.5 app, `pnpm exec tsc --noEmit` clean, `pnpm test --run` 30/30 green. All Phase 1 milestones (M1–M10) complete + 6-phase pricing engine refactor complete, all on `main`. Full feature set: auth, masterlists CRUD, pricing config, pricing engine (bottom-up revenue model), quote builder + editor + PDF, bookings with FSM, truck availability calendar, live dashboard. Login with `jess` / `admin123` (or credentials in `.env.local`).

**Public URL:** `https://joleo.sas-agent.co.uk` (via the existing Nucbox cloudflared tunnel, ID `bda80536-0b37-4881-b1f7-bf2bf6b348ac`). Dev server bound to `*:3000`, accessible via LAN (`192.168.254.166`), Tailscale (`100.87.42.111`), and the public hostname. `NEXTAUTH_URL=https://joleo.sas-agent.co.uk` set in `.env.local` so post-login redirects resolve correctly.

**Phase 1 is complete. Phase 2 (customer-facing portal) is parked.**

---

## Architecture Snapshot

### App routes (`src/app/`)
- `(auth)/login/page.tsx` — two-column mockup layout, LoginForm client component
- `api/auth/[...nextauth]/route.ts` — Auth.js handlers
- `(admin)/layout.tsx` — grid: 240px Sidebar + main; reads session from auth()
- `(admin)/dashboard/page.tsx` — live stat cards, today's schedule, fleet status, recent quotes
- `(admin)/trucks/page.tsx` — trucks list, includes truckType
- `(admin)/drivers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/helpers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/clients/page.tsx` — no Decimal fields
- `(admin)/route-areas/page.tsx` — serializes surcharge/estimatedToll .toNumber()
- `(admin)/pricing-config/page.tsx` — Pricing Config UI (6 sections + live preview + audit log); replaces rate-settings
- `(admin)/rate-settings/page.tsx` — redirects to /pricing-config (keeps old bookmarks working)
- `(admin)/users/page.tsx` — users list, no Decimals
- `(admin)/quotes/page.tsx` — quotes list, serializes finalPrice .toNumber()
- `(admin)/quotes/new/page.tsx` — loads clients/truckTypes/routeAreas/settings, serializes all Decimals
- `(admin)/quotes/[id]/page.tsx` — quote detail with pricingSnapshot breakdown + Edit + Download PDF buttons
- `(admin)/quotes/[id]/edit/page.tsx` — quote editor; reuses QuoteBuilderForm with pre-filled values
- `(admin)/bookings/page.tsx` — bookings list, includes client/truck/driver/quote
- `(admin)/bookings/new/page.tsx` — standalone booking creation form
- `(admin)/bookings/[id]/page.tsx` — booking detail with assignment form + status transitions
- `(admin)/calendar/page.tsx` — week grid; `?week=YYYY-MM-DD` param; loads trucks + bookings for week
- `(admin)/dashboard/page.tsx` — live stats + today's schedule + Fleet Status card + Recent Quotes card + 2-col split layout

### Top-level app files (`src/app/`)
- `icon.png` — 32×32 favicon (generated from `docs/356378784_*.jpg` via sharp + trim)
- `apple-icon.png` — 180×180 Apple touch icon
- `layout.tsx` — Google Fonts CDN `<link>` tags in `<head>` (Fraunces / DM Sans / JetBrains Mono); no `next/font/google` imports
- `globals.css` — CSS vars resolve to literal `'Fraunces'` / `'DM Sans'` / `'JetBrains Mono'`; `.display-font` and `.mono` utility classes added

### Components (`src/components/`)
- `layout/Sidebar.tsx` — nav-dot items, "Transport · Admin", active state via usePathname; nav label is "Pricing Config"
- `layout/PageHeader.tsx` — reusable page header
- `auth/LoginForm.tsx` — useActionState + useFormStatus
- `users/ResetPasswordDialog.tsx` — Radix Dialog
- `trucks/`, `drivers/`, `helpers/`, `clients/`, `route-areas/` — ListClient + Dialog per entity
- `pricing-config/PricingConfigForm.tsx` — 6-section pricing config form with live preview panel, markup validator, save/reset/audit-log modals
- `quotes/QuoteListClient.tsx` — quotes table with status badges
- `quotes/QuoteBuilderForm.tsx` — client component: billing type toggle, auto long-distance hint, manual override price, service-flag dropdowns with inline ₱ amounts
- `quotes/PriceBreakdownPanel.tsx` — new shape: base components → revenue allocations → revenue/VAT/toll → final (override row when applicable)
- `pdf/QuotationPDF.tsx` — @react-pdf/renderer A4 document; 4-line pricing summary; uses effectiveVatAmount/effectiveRevenueNetOfVat; billing type in inclusions
- `bookings/BookingListClient.tsx` — filterable bookings table (search, status, date)
- `bookings/BookingDetailClient.tsx` — assignment form + FSM status transitions + billing type display
- `bookings/NewBookingForm.tsx` — standalone booking creation with billing type dropdown
- `bookings/TruckCalendar.tsx` — week grid with booking blocks and unavailable stripes

### Actions (`src/actions/`)
- `auth.ts` — loginAction, signOutAction
- `users.ts` — resetPasswordAction
- `trucks.ts`, `drivers.ts`, `helpers.ts`, `clients.ts`, `route-areas.ts` — upsert actions
- `pricing-config.ts` — updatePricingConfigAction (AuditLog with before/after), resetToDefaultsAction
- `quotes.ts` — saveQuoteAction (QT number gen, computePrice, Quote creation), updateQuoteAction (QUOTE_UPDATED audit log), convertToBookingAction
- `bookings.ts` — transitionBookingAction (FSM + conflict check + audit), updateBookingAssignmentAction, createBookingAction

### Features
- `src/features/auth/config.edge.ts` — edge-safe NextAuth config (no Prisma)
- `src/features/auth/config.ts` — full NextAuth config with bcryptjs + Prisma
- `src/features/pricing/types.ts` — PricingInput, PricingContext, PricingResult, BillingType, revenue allocation fields
- `src/features/pricing/engine.ts` — pure `computePrice(input, ctx): PricingResult`; bottom-up revenue model
- `src/features/pricing/engine.test.ts` — 30 test cases covering worked example, fuel floor, long-distance, billing types, VAT modes, toll, discount, override, service flags, snapshot integrity
- `src/features/booking/state-machine.ts` — DRAFT→QUOTED→CONFIRMED→DISPATCHED→COMPLETED / CANCELLED FSM

### Lib
- `src/lib/db.ts`, `env.ts`, `format.ts`, `utils.ts`
- `src/lib/user-role.ts` — maps username → display role (shem/vyela → Owner, gina → Admin)
- `src/middleware.ts` — auth guard via edge config; matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `icon.png`, `apple-icon.png`
- `src/types/next-auth.d.ts` — session/user/JWT type augmentation

### Schema models
- User, TruckType (with eightHourBaseRate/perTripBaseRate), Truck, Driver, Helper, Client, RouteArea
- RateSettings — 7 new fields: driverRate, helperRate, overheadRate, longDistanceRate, longDistanceThresholdKm, fuelFloor, fuelEfficiencyKmpl
- Quote (with tripBillingType), Booking (with tripBillingType), BookingHelper, AuditLog
- BillingType enum: EIGHT_HOUR | PER_TRIP
- Migration: `prisma/migrations/20260522085840_pricing_engine_refactor`

---

## Key Decisions

### Decision: Pricing engine — pure function, corrected Excel
- Engine lives at `src/features/pricing/engine.ts` — no DB access, no side effects
- Caller resolves `RateSettings` + `TruckType` from DB and passes them in
- Pct fields in DB are fractions (0.05 = 5%) — engine receives raw fractions, do NOT ×100
- Do NOT change formula unless business explicitly requests it

### Decision: Pricing engine — bottom-up revenue model (2026-05-22)
- Formula: `revenue_net_of_vat = base_costs / (1 - markup_total)`
- `markup_total = driverRate + helperRate + overheadRate [+ longDistanceRate if triggered]`
- Replaces the old cost+margin model; avoids double-counting
- Fuel: `MAX(fuelFloor, distance × 2 / efficiency × diesel_price)` — floor is a global setting
- Toll is added AFTER markup — true pass-through, no VAT applied to it
- Manual override back-computes `effectiveVatAmount` and `effectiveRevenueNetOfVat` for BIR compliance
- Markup total ≥ 100% is a hard validation error (would cause division by zero)

### Decision: BillingType enum — EIGHT_HOUR | PER_TRIP (2026-05-22)
- Stored on both Quote and Booking as `tripBillingType`
- Propagates from quote through booking conversion
- Drives which base rate is selected from TruckType (`eightHourBaseRate` vs `perTripBaseRate`)
- Displayed in Quote detail, Booking detail, and PDF inclusions so client sees what they're getting

### Decision: Long-distance is auto-derived, not a checkbox (2026-05-22)
- Applied automatically when `estimatedDistanceKm >= longDistanceThresholdKm` (from RateSettings)
- No admin toggle needed — a visual badge appears in the distance field hint in Quote Builder
- Eliminates the "easy-to-forget checkbox" UX problem from the old builder

### Decision: Pricing Config UI replaces Rate Settings (2026-05-22)
- `/pricing-config` is the new route; `/rate-settings` redirects there (no broken bookmarks)
- Sidebar nav renamed to "Pricing Config"
- 6 sections: Labor Markups, Overhead & Surcharges, Fuel Config, Trip Base Rates (per-truck-type table), Service Add-ons, Tax (locked VAT)
- Live preview panel runs the actual engine (sample: 30km, 8-hour, first truck type)
- Fuel-floor breakeven hint shown inline
- Save confirmation modal, reset-to-defaults modal, audit log modal (last 10 changes)

### Decision: Quote Edit route (2026-05-22)
- `/quotes/[id]/edit` reuses QuoteBuilderForm with pre-filled values
- Save action is `updateQuoteAction` — logs `QUOTE_UPDATED` to AuditLog with before/after key fields (not full object, to keep it readable)
- "Edit" button appears on quote detail page (outlined maroon, between Back and Download PDF)

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
- Applies to: Driver, Helper, RouteArea, RateSettings, TruckType Decimal fields

### Decision: Fonts via Google Fonts CDN, not next/font (2026-05-20)
- Replaced `next/font/google` with literal `<link>` tags in `src/app/layout.tsx`, matching `build-guide/joleo_mockup.html` exactly
- User directive: *"Do not substitute fonts. Match the Joleo mockup exactly."*
- Do NOT migrate back to `next/font` without explicit user confirmation, even for performance reasons

### Decision: Public access via existing cloudflared tunnel (2026-05-20)
- Reused the Nucbox's `aplaya` tunnel (ID `bda80536-0b37-4881-b1f7-bf2bf6b348ac`) rather than spinning up a new tunnel
- Added `joleo.sas-agent.co.uk` ingress in `/etc/cloudflared/config.yml`
- Do NOT touch the other ingress entries — they serve other projects on the same Nucbox

### Decision: DejaVu Sans for ₱ glyph in PDFs (2026-05-20)
- Helvetica, Roboto, and Noto Sans Latin subsets all lack U+20B1 (₱ Philippine Peso Sign)
- DejaVu Sans Regular confirmed via byte search; DejaVu Sans Bold does NOT have it
- TTFs at `public/fonts/DejaVuSans.ttf` / `public/fonts/DejaVuSans-Bold.ttf`
- Registered via `path.resolve(process.cwd(), "public/fonts/...")` — do NOT use URLs or absolute system paths
- All monetary amount strings use Regular weight; labels/headings use Bold

### Decision: Explicit `import React` in QuotationPDF.tsx (2026-05-20)
- @react-pdf/renderer v4 custom fiber reconciler requires explicit React import
- Symptom without it: `ReferenceError: React is not defined` at runtime
- Do NOT remove even though Next.js 15 uses automatic JSX transform everywhere else

### Decision: Favicons from truck logo (2026-05-20)
- Source: `docs/356378784_599377255674979_8027307442482878578_n.jpg`
- Generated via `sharp().trim()` then `.resize()` to 32×32 and 180×180

---

## Active Gotchas
- Tailwind v4: `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` in postcss.config.mjs
- Auth.js v5: `next-auth@beta`; `AUTH_TRUST_HOST=true` AND `NEXTAUTH_URL=https://joleo.sas-agent.co.uk` in .env.local
- `jose` v6 Edge Runtime CompressionStream warnings — harmless, known upstream issue
- `env.ts` validates at startup — missing required var = app won't start
- Sidebar uses inline styles for SSR brand var consistency
- All Dialogs use `@radix-ui/react-dialog` — already installed
- `decimal.js` already installed — use it for all currency math
- `middleware.ts` matcher MUST exclude any top-level app-root icon files (`icon.png`, `apple-icon.png`)
- pnpm 11 requires `allowBuilds:` in `pnpm-workspace.yaml` with **booleans**, not placeholder strings
- cloudflared cert.pem on the Nucbox is only authorized for the aplaya-dev.cc zone — create sas-agent.co.uk CNAMEs via Cloudflare dashboard manually
- sudo on the Nucbox needs a real TTY — Claude Code's Bash tool cannot prompt for password

---

## Session Continuity (2026-05-22)
- Last worked on: Verified 6-phase pricing engine refactor (previous session was cut off; this session confirmed all phases clean — TSC 0 errors, 30/30 tests, all files present)
- **Immediate next step:** Live browser test — Pricing Config live preview, New Quote billing-type toggle, and PDF download at `https://joleo.sas-agent.co.uk`
- **Open item:** `docs/Joleo_Update_Guide.md` still has the old worked-example ₱ figure; the correct value is ₱5,932.14 (confirmed by test). Update the guide doc to match.
- **Not blocked:** All code is clean. No ISE, no type errors.
- Do NOT touch:
  - `/etc/cloudflared/config.yml` and other ingress entries on the Nucbox
  - Font system (must stay on Google Fonts CDN per user directive)
  - `import React from "react"` in `QuotationPDF.tsx` (required by @react-pdf/renderer reconciler)
  - DejaVu font files in `public/fonts/`
  - `pnpm-workspace.yaml` `allowBuilds:` booleans

---

## Reference: M6 Quote Builder Details (archived)

### Quote number generation
```typescript
// QT-YYYYMMDD-NNNN — daily sequence reset, Asia/Manila TZ
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
