# BUILD_PROGRESS

## System Health
Last updated: 2026-05-22 (late session — Phase 1.5: Clients & AI complete)

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

### Phase 1.5 — Clients & AI (2026-05-22 late session) ⭐
**Client schema overhaul** (`20260522160000_client_type_three_way`)
- `companyName` → `clientName`, `businessType` → `type`
- Enum redesigned: `ClientType` = INDIVIDUAL_PERSON | INDIVIDUAL_BUSINESS | CORPORATION_BUSINESS
- Three-way segmented toggle in dialog; name label, TIN visibility, address label all adapt per type
- 18 files updated across actions/components/pages to use new field names
- Existing 34 customers backfilled: 12 → CORPORATION_BUSINESS, 22 → INDIVIDUAL_BUSINESS; then 10 reclassified to INDIVIDUAL_PERSON by user (ARIEL NAPO, CHRISTINA MINA, GUY GUILLEGO, IMPY PILAPIL, JEREMY GUIAB, LAWRENCE PINEDA, LESTER JACINTO, VIRGIE COQUIA, NOEL CRUZ, LUDIVINA VILLARICA)

**Auto-generated client codes**
- `generateClientCode()` in `src/actions/clients.ts` — `CL-NNNN` (4-digit zero-padded, sequential)
- Dialog: Client Code field is read-only; "Auto-generated on save" placeholder in Add mode
- Update path never touches `clientCode` (codes are immutable after creation)
- Backfill: all 34 existing clients re-coded `CL-0001` through `CL-0034` by `createdAt` order
- Old hand-rolled `import-clients.ts` script deleted (served its one-time purpose)

**Client form validation** (3 layers)
- Live `sanitizePhone()` / `sanitizeEmail()` strip invalid chars on keystroke
- `onBlur` formatters normalize PH mobile to canonical shape; landline trims whitespace; email lowercases
- Server-side Zod with `PH_MOBILE_RE` and `PH_LANDLINE_RE`
- HTML `pattern` attribute removed (`/v` flag incompat)
- All 9 text fields converted to controlled state to survive React 19 form-action reset
- Payment Terms select uses hidden-input workaround for select reconciliation quirk
- `aria-describedby={undefined}` added to all 5 Radix Dialog.Content elements

**Quote schema additions** (`20260522150000_quote_notes_and_schedule`)
- `Quote.notes` (internal admin notes, never on PDF) — separate from `serviceDescription` (client-facing PDF text)
- `Quote.scheduledDate` (DATE, required on form) + `Quote.scheduledStartTime` (HH:MM, optional)
- Convert-to-booking now uses `quote.scheduledDate` instead of defaulting to today

**AI features via LiteLLM gateway → Claude Haiku 4.5**
- `src/lib/ai.ts` — fetch wrapper for OpenAI-compatible endpoint, `smart` alias
- `src/actions/ai-quotes.ts` — `generateServiceDescriptionAction` (uses all form fields + notes, 2–3 sentences) and `generateClientMessageAction` (SMS/Viber draft)
- Service Description card moved to right column above Price Breakdown (sticky)
- Client Message Drafter card on `/quotes/[id]` with Draft / Copy / Regenerate buttons

**Route/Area removed from UI**
- Quote Builder form, PDF, sidebar nav — all dropped
- Schema column + `/route-areas` admin page kept (parking)

**Quote detail page upgrades**
- "Convert to Booking" button (header) — only shown when not yet converted
- Service Flags section hides entirely when no flags are active (previously rendered all 4 in muted styling)
- Quote No in `/quotes` list is now a clickable Link to detail page

**Sidebar Logout**
- Small Logout button next to user info in footer (was missing — user had no way to sign out)

**PDF tweaks**
- Service Description renders as compact paragraph after header (only if present)
- Italic style removed (no italic DejaVu font on disk → would crash PDF generation)
- Scheduled Date + Start Time added to Client & Booking Details grid (5 rows × 2 cols)
- Route/Area row removed

**Migrations applied:** `20260522120000_add_client_extended_fields`, `20260522130000_quote_service_description`, `20260522150000_quote_notes_and_schedule`, `20260522160000_client_type_three_way`

**Files this phase:** ~22 modified, ~3 created (`src/lib/ai.ts`, `src/actions/ai-quotes.ts`, `src/components/quotes/ClientMessageDrafter.tsx`), 1 deleted (`scripts/import-clients.ts`)

### Post-Phase 1.5 polish (2026-05-23)
**Bug fixes**
- Quotes list "Date & Time" was showing `createdAt` (creation timestamp) — now shows `scheduledDate + scheduledStartTime`; falls back to `createdAt` for old quotes without a scheduled date
- `trucks/page.tsx` was passing raw Prisma Decimal objects (`eightHourBaseRate`, `perTripBaseRate`, `dailyRate`, `excessHourRate` on TruckType) to `TruckListClient` — caused "Decimal objects are not supported" RSC crash; fixed with explicit `.map()` + `.toNumber()`; `TruckListClient` field types updated from `unknown` → `number`

**UX improvements**
- Bookings list: `bookingNo` is now a clickable maroon link to `/bookings/[id]` (same pattern as Quote No.); start time shown as muted second line in Date column when set
- Booking Detail: truck dropdown options show truck type label (`V5 — ABC 1234 · 14 ftr - 6 wheels`); "Quoted Truck Type" row added to Booking Information card; ⚠ mismatch warning under dropdown when assigned truck type differs from quoted type

**Files changed:** `src/app/(admin)/quotes/page.tsx`, `src/components/quotes/QuoteListClient.tsx`, `src/app/(admin)/bookings/page.tsx`, `src/components/bookings/BookingListClient.tsx`, `src/app/(admin)/bookings/[id]/page.tsx`, `src/components/bookings/BookingDetailClient.tsx`, `src/app/(admin)/trucks/page.tsx`, `src/components/trucks/TruckListClient.tsx`

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
| — | Phase 1.5 — Clients & AI | ✅ Complete |
