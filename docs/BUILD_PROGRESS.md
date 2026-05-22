# BUILD_PROGRESS

## System Health
Last updated: 2026-05-22 (6-phase pricing engine refactor complete)

## ✅ Stable — Do Not Touch
### M1 — Foundation
- Next.js 15.5 App Router scaffolded (manual, no create-next-app)
- Tailwind v4 configured (CSS-based, no tailwind.config.js)
- Brand CSS variables + @theme tokens applied in globals.css
- Fraunces / DM Sans / JetBrains Mono fonts loaded via Google Fonts CDN (not next/font)
- Prisma 6 schema complete (all models, enums, indexes)
- Prisma client generated
- Sidebar component — all 3 sections, nav-dot active state, brand mark, footer
- Admin layout shell (240px sidebar + main grid)
- Dashboard stub page (stat cards + today's schedule)
- CLAUDE.md + docs/ context files created
- docker-compose.yml, docker-compose.dev.yml, Dockerfile
- ESLint config (flat config for Next.js 15)

### M2 — Auth + Users
- Auth.js v5 split config: config.edge.ts (middleware) + config.ts (full)
- Login page — two-column layout matching mockup
- Middleware protects all routes; unauthenticated → /login
- Seed: 7 truck types, 17 trucks, 9 drivers, 7 helpers, 8 route areas, 5 clients, RateSettings, 3 admin users
- Users page — list, role/status badges, password reset dialog
- Server actions: loginAction, signOutAction, resetPasswordAction

### M3 — Masterlists CRUD
- Trucks, Drivers, Helpers, Clients, Route Areas pages — list + add/edit dialogs
- All server actions: Zod validation, upsert, P2002 handling, revalidatePath
- Decimal serialization at server/client boundary (.toNumber() in page components)

### M4 — Rate Settings → Pricing Config (replaced 2026-05-22)
- Original: single-form page, 25 RateSettings fields, pct as fractions, AuditLog on save
- **Replaced by Pricing Config UI** — 6 sections, live preview panel, markup validator, save/reset/audit-log modals
- `/rate-settings` redirects to `/pricing-config` (no broken bookmarks)
- VAT rate still readonly (12%, locked)

### M5 — Pricing Engine ⭐
- `src/features/pricing/types.ts` — PricingInput, PricingContext, PricingResult, BillingType, revenue allocation fields
- `src/features/pricing/engine.ts` — pure `computePrice(input, ctx)`, bottom-up revenue model, no DB access
- Bottom-up formula: `revenue_net_of_vat = base_costs / (1 - markup_total)`
- Fuel: `MAX(fuelFloor, distance × 2 / efficiency × price)`; toll added after markup (true pass-through)
- VAT_INCLUSIVE / VAT_EXCLUSIVE / NON_VAT handling; manual override back-computes effectiveVatAmount
- `src/features/pricing/engine.test.ts` — 30 test cases, **30/30 pass** (worked example ₱5,932.14, fuel floor, long-distance, billing types, VAT modes, toll, discount, override, service flags, snapshot integrity)
- `pnpm exec tsc --noEmit` ✅ clean | `pnpm test --run` ✅ 30/30

### M6 — Quote Builder ⭐
- `src/actions/quotes.ts` — saveQuoteAction, updateQuoteAction (QUOTE_UPDATED audit log), convertToBookingAction
- `src/app/(admin)/quotes/page.tsx` — list page with status badges + "New Quote" button
- `src/app/(admin)/quotes/new/page.tsx` — server page loads context
- `src/app/(admin)/quotes/[id]/page.tsx` — detail: info + flags + pricingSnapshot breakdown + Edit + PDF buttons
- `src/app/(admin)/quotes/[id]/edit/page.tsx` — quote editor; reuses QuoteBuilderForm with pre-filled values
- `src/components/quotes/QuoteBuilderForm.tsx` — billing type toggle, auto long-distance hint, manual override price, service-flag dropdowns with inline ₱ amounts
- `src/components/quotes/PriceBreakdownPanel.tsx` — base components → revenue allocations → revenue/VAT/toll → final

### M7 — Bookings + Calendar ⭐
- `src/features/booking/state-machine.ts` — FSM with `canTransition()`, `BookingTransitionError`, `BookingConflictError`
- `src/actions/bookings.ts` — `transitionBookingAction`, `updateBookingAssignmentAction`, `createBookingAction`
- `/bookings` — list with search + status filter
- `/bookings/new` — standalone booking form with billing type dropdown
- `/bookings/[id]` — assignment form + status transitions + billing type display
- `/calendar` — week grid, color-coded booking blocks, week nav via URL `?week=`

### M8 — Dashboard ⭐
- `/dashboard` — live stat cards (Active Bookings, Fleet Active, Quotes MTD, Revenue MTD)
- Today's Schedule, Fleet Status card, Recent Quotes card, 2-col split layout

### M9 — Dockerize + Deploy
- `docker-compose.yml`, `Dockerfile`, `docker/Caddyfile`, Cloudflare Tunnel config
- `output: "standalone"` in `next.config.ts`

### M10 — Polish + Testing
- `TEST_GUIDE.md` — full manual testing walkthrough for all Phase 1 features

### Post-M10 polish (2026-05-20)
- **Dashboard mockup parity** — Fleet Status card, Recent Quotes card, 2-col layout
- **TruckCalendar React key fix** — `<Fragment key={truck.id}>` replacing shorthand
- **Fonts: Google Fonts CDN swap** — literal `<link>` tags, CSS vars to literal font names
- **Favicons** — `icon.png` (32×32) + `apple-icon.png` (180×180) from truck logo via sharp
- **middleware.ts matcher** — excludes `icon.png` and `apple-icon.png`
- **Public URL live** — `https://joleo.sas-agent.co.uk` via Cloudflare tunnel
- **NEXTAUTH_URL** set to public hostname in `.env.local`
- **pnpm-workspace.yaml** — `allowBuilds:` with booleans for pnpm 11
- **PDF redesigned** — client-facing document, DejaVu Sans for ₱, 1-page compact layout, explicit React import

### Post-M10 pricing engine refactor (2026-05-22) ⭐
**Phase 1 — Schema migration** (`20260522085840_pricing_engine_refactor`)
- New `BillingType` enum: `EIGHT_HOUR | PER_TRIP`
- `TruckType`: dropped `minBaseRate`+`fuelKmPerLiter`, added `eightHourBaseRate`+`perTripBaseRate`
- `RateSettings`: dropped 14 obsolete fields, added 7 new ones (driverRate, helperRate, overheadRate, longDistanceRate, longDistanceThresholdKm, fuelFloor, fuelEfficiencyKmpl)
- `Quote` + `Booking`: dropped nightDelivery/outOfTown/longDistance/parkingFee flags, added `tripBillingType`
- Seed updated with new defaults

**Phase 2 — Pricing engine** (bottom-up revenue model)
- 30 tests replacing old 41 — full coverage of new formula
- Long-distance auto-derived from distance threshold; toll is a true pass-through; manual override is BIR-compliant

**Phase 3 — Pricing Config UI** (`/pricing-config`)
- 6 sections + live preview panel (runs actual engine) + fuel-floor breakeven hint
- Markup-sum validator, save/reset confirmation modals, audit log modal (last 10 changes)
- `/rate-settings` → redirects; sidebar renamed

**Phase 4 — Quote Builder + Editor**
- Removed: Night Delivery, Out-of-Town, Long Distance toggle, Parking Fee, Included Hours fields
- Added: BillingType pill toggle, auto long-distance badge, Manual Override Price field
- Service flag dropdowns show inline ₱ amounts
- New `/quotes/[id]/edit` route; `updateQuoteAction` with audit log

**Phase 5 — Quote detail + Bookings**
- PriceBreakdownPanel rebuilt for new shape; "Edit" button on detail; Service Flags row updated
- Billing Type shown in Truck & Crew section, NewBookingForm dropdown, Booking detail

**Phase 6 — PDF + cleanup**
- 4-line pricing summary (Service Fee → Toll → VAT → GRAND TOTAL)
- Uses `effectiveVatAmount`/`effectiveRevenueNetOfVat` for BIR-compliant override math
- Exclusions list updated; billing type shown in inclusions
- Files: 4 created, 6 rewritten, 11 modified, 2 deleted (actions/rate-settings.ts, RateSettingsForm.tsx)

## 🧪 Experimental (treat as fragile)
_(none)_

## 🚫 Known Issues (Deprioritized)
- AUTH_TRUST_HOST=true in .env.local — dev server port no longer matters
- **Joleo_Update_Guide.md** — worked-example ₱ figure is outdated; correct value is ₱5,932.14 (confirmed by engine tests). Guide doc not yet updated.

## Milestone Status
| # | Milestone | Status |
|---|---|---|
| M1 | Foundation | ✅ Complete |
| M2 | Auth + Users | ✅ Complete |
| M3 | Masterlists CRUD | ✅ Complete |
| M4 | Rate Settings → Pricing Config | ✅ Complete |
| M5 | Pricing Engine | ✅ Complete |
| M6 | Quote Builder + Editor | ✅ Complete |
| M7 | Bookings + Calendar | ✅ Complete |
| M8 | Dashboard | ✅ Complete |
| M9 | Dockerize + Deploy | ✅ Complete |
| M10 | Polish + Testing | ✅ Complete |
| — | Pricing Engine Refactor (6-phase) | ✅ Complete |
