# BUILD_PROGRESS

## System Health
Last updated: 2026-05-19 (M8 complete)

## ✅ Stable — Do Not Touch
### M1 — Foundation
- Next.js 15.5 App Router scaffolded (manual, no create-next-app)
- Tailwind v4 configured (CSS-based, no tailwind.config.js)
- Brand CSS variables + @theme tokens applied in globals.css
- Fraunces / DM Sans / JetBrains Mono fonts loaded via next/font/google
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

### M4 — Rate Settings
- Single-form page, all 25 RateSettings fields in 6 sections
- VAT rate readonly; pct fields stored as fractions, displayed × 100
- Save → AuditLog with before/after snapshot; View change log dialog
- README updated with full NUCBox setup + Cloudflare Tunnel guide

### M5 — Pricing Engine ⭐
- `src/features/pricing/types.ts` — PricingInput, PricingContext, PricingResult, LineItem, PricingWarning
- `src/features/pricing/engine.ts` — pure `computePrice(input, ctx)`, all Decimal.js, no DB access
- 16 computation steps (truck base rate through maintenance allowance)
- Overhead (10%) + contingency (3%) on direct cost; floor/target/ceiling margin prices
- VAT_INCLUSIVE / VAT_EXCLUSIVE / NON_VAT handling
- 3 warnings: PRICE_VS_FLOOR, JOB_HOURS, PROFIT_MARGIN
- `src/features/pricing/engine.test.ts` — 8 test cases, **41/41 tests pass**
- Key correction: Excel had broken cell refs for steps 1 & 16 (both showed 0)
  Engine includes both — corrected V6 reference target = ₱18,532 (not ₱11,209.60)
- `pnpm build` ✅ clean | `pnpm test` ✅ 41/41 | Committed + pushed

### M6 — Quote Builder ⭐
- `src/actions/quotes.ts` — saveQuoteAction: QT number gen, computePrice, Quote + optional Booking
- `src/app/(admin)/quotes/page.tsx` — list page with status badges + "New Quote" button
- `src/app/(admin)/quotes/new/page.tsx` — server page loads context (clients/truckTypes/routeAreas/settings)
- `src/app/(admin)/quotes/[id]/page.tsx` — detail view: info + flags + pricingSnapshot breakdown + PDF link
- `src/components/quotes/QuoteBuilderForm.tsx` — two-column form, useMemo live pricing (no server round-trip)
- `src/components/quotes/PriceBreakdownPanel.tsx` — live breakdown: line items + tier grid (Floor/Target/Ceiling) + warnings
- `src/components/pdf/QuotationPDF.tsx` — @react-pdf/renderer A4 quotation document
- `src/app/api/quotes/[id]/pdf/route.tsx` — PDF download route (auth-guarded)
- `pnpm build` ✅ clean | `pnpm test` ✅ 41/41 | Committed + pushed

### M7 — Bookings + Calendar ⭐
- `src/features/booking/state-machine.ts` — FSM with `canTransition()`, `BookingTransitionError`, `BookingConflictError`
- `src/actions/bookings.ts` — `transitionBookingAction` (validates FSM, conflict check, audit log), `updateBookingAssignmentAction`, `createBookingAction`
- `/bookings` — list with search + status filter, truck pill badges, status badges
- `/bookings/new` — standalone booking form
- `/bookings/[id]` — assignment form (truck/driver/helpers/date/time) + status transition buttons
- `/calendar` — week grid (trucks × days), color-coded booking blocks, week nav via URL `?week=`
- `pnpm build` ✅ clean | `pnpm test` ✅ 41/41 | Committed + pushed

### M8 — Dashboard ⭐
- `/dashboard` — live stat cards (Active Bookings, Fleet Active, Quotes MTD, Revenue MTD)
- Today's Schedule table with real booking data
- `pnpm build` ✅ clean | Committed + pushed

### M9 — Dockerize + Deploy
- Already complete from M1 (`docker-compose.yml`, `Dockerfile`, `docker/Caddyfile`, Cloudflare Tunnel config)
- `output: "standalone"` in `next.config.ts`

### M10 — Polish + Testing
- `TEST_GUIDE.md` — full manual testing walkthrough for all Phase 1 features

## 🧪 Experimental (treat as fragile)
_(none)_

## 🚫 Known Issues (Deprioritized)
- favicon.ico missing → 404 in browser console (harmless, add in M10 polish)
- AUTH_TRUST_HOST=true in .env.local — dev server port no longer matters

## Milestone Status
| # | Milestone | Status |
|---|---|---|
| M1 | Foundation | ✅ Complete |
| M2 | Auth + Users | ✅ Complete |
| M3 | Masterlists CRUD | ✅ Complete |
| M4 | Rate Settings | ✅ Complete |
| M5 | Pricing Engine | ✅ Complete |
| M6 | Quote Builder | ✅ Complete |
| M7 | Bookings + Calendar | ✅ Complete |
| M8 | Dashboard | ✅ Complete |
| M9 | Dockerize + Deploy | ✅ Complete |
| M10 | Polish + Testing | ✅ Complete |
