# BUILD_PROGRESS

## System Health
Last updated: 2026-05-26 — Per-helper markup refactor + FIX-008→012 + silent-₱0 guard + JWT FK mapping. TSC clean, 36/36 tests pass.

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
- Fuel: `MAX(fuelFloor, distance × 2 / efficiency × price)`; toll in base costs (same markup + VAT as all other costs)
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
- Calendar truck rows sorted by booking status priority: DISPATCHED → CONFIRMED → QUOTED → DRAFT → unbooked (ties by code)
- Calendar "Quoted" status: amber (#B8801C) solid border + white text; distinct from DRAFT (white/dashed); legend reordered to match priority

### M8 — Dashboard ⭐
- `/dashboard` — live stat cards (Active Bookings, Fleet Active, Quotes MTD, Revenue MTD)
- Today's Schedule, Fleet Status card, Recent Quotes card, 2-col split layout

### M9 — Dockerize + Deploy
- `docker-compose.yml`, `Dockerfile`, `docker/Caddyfile`, Cloudflare Tunnel config
- `output: "standalone"` in `next.config.ts`
- `.dockerignore` created: excludes `.next/cache`, `node_modules`, `.git`, `.env*.local`

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

### 2026-05-23 — Booking UX overhaul + toll BIR fix ⭐

**Bug fixes (earlier in session)**
- Quotes list "Date & Time" showing `createdAt` → now shows `scheduledDate + scheduledStartTime`; falls back to `createdAt` for old quotes
- `trucks/page.tsx` raw Prisma Decimal objects passed to `TruckListClient` → "Decimal objects not supported" RSC crash; fixed with `.map()` + `.toNumber()`

**Booking UX — Quoted Truck Type visibility**
- "Quoted Truck Type" DetailRow in Booking Information card (server-resolved label)
- Truck dropdown options show type label: `V5 — ABC 1234 · 14 ftr 6W`
- ⚠ mismatch warning when assigned truck type ≠ quoted type

**Booking UX — End Time auto-compute**
- `handleStartTimeChange` adds `estimatedHours` to start time and fills End Time client-side
- Billing type label renamed "8 Hours" → "Per 8 Hours" across 5 surfaces (QuoteBuilderForm, quote detail, booking detail, NewBookingForm, PDF)

**Booking assignment form — React 19 definitive fix**
- Switched from `<form action={serverAction}>` to `<form onSubmit={handleAssignSubmit}>`
- Manual FormData built from React state in `startTransition` — immune to form reset lifecycle
- Truck/driver/date/notes all fully controlled; no hidden-input workarounds needed

**Driver conflict detection**
- `checkDriverConflict(driverId, date, excludeBookingId?)` in `src/actions/bookings.ts`
- Mirrors `checkTruckConflict` pattern; wired into all three booking actions

**Auto-recompute quoted amount on truck type change**
- `useMemo` in BookingDetailClient calls `computePrice()` client-side when `selectedTruckId` maps to a different truck type than `booking.quotedTruckTypeId`
- Financials section shows Original (strikethrough) and Recomputed (maroon) amounts
- `recomputedAmount` appended to FormData on save; stored to `quotedAmount` in DB

**Price recomputation history**
- `AuditLog` action `BOOKING_PRICE_UPDATED`: `before/after` JSON includes quotedAmount, truckType label, username
- Booking detail fetches history and shows Price History card (descending, Asia/Manila timestamps)

**Toll formula finalized — toll in base costs**
- Iterated: pass-through → VAT base → **base costs** (final, per Shem: "for simplicity")
- `base_costs = fuel + tripBase + distance + other + toll`; toll gets same markup + VAT as all other costs
- Override back-compute simplified: `effectiveRevenue = override / (1 + vatRate)` — no toll subtraction
- Stale "pass-through" labels cleared: PriceBreakdownPanel.tsx, types.ts comments, PDF terms text
- UI label everywhere: "Toll" (no "pass-through" qualifier)
- 30/30 tests updated; TSC clean; all pushed to origin/main

### 2026-05-23 — PDF upgrades + Payment Config (Vyela feedback) ⭐
- `paymentTerms` moved Client→Quote: schema migration (`20260523000000_quote_payment_terms`), 12+ files updated; pre-filled default in Quote Builder Section C
- PDF: "Payment Terms" section (from quote field); "Payment Details" 3-column bank/GCash cards (from PaymentConfig DB); "Conforme" signature block
- PDF layout tightened throughout (paddingTop, section margins, row padding) to maintain single-page output
- `PaymentConfig` singleton model + migration (`20260523100000_payment_config`); seeded EastWest/BDO/GCash
- `/payment-config` admin page (sidebar: Configuration → Payment Details); editable 3-card form
- Calendar: truck rows sorted by booking status priority; Quoted status amber color (#B8801C); legend reordered
- `.dockerignore` created; dev server restarted (2.5GB→352MB RAM)

### 2026-05-26 — Per-helper markup + FIX-008→012 + reliability ⭐
**Per-helper markup refactor (Gina's rule)**
- Pricing engine now scales helper allocation by `numberOfHelpers`: `markup = driverRate + (helperRate × numHelpers) + overheadRate [+ longDistanceRate]`. 1 helper = 27.5% (same baseline as before), 2 helpers = 35%, 3 = 42.5%.
- Engine validates `numberOfHelpers ≥ 1` (integer). Throws `PricingValidationError` for 0/negative/non-integer.
- Dropped: `Quote.additionalHelper` boolean, `RateSettings.additionalHelperRate` ₱750 surcharge, "Additional Helper?" select in QuoteBuilderForm, "Additional Helper" input in PricingConfigForm, breakdown panel row, PDF inclusion line.
- Threaded `numberOfHelpers` through both engine call sites (`saveQuoteAction`, `updateQuoteAction`) and `BookingDetailClient` recompute.
- Migration: `20260526010000_drop_additional_helper`.
- Tests 36/36: added per-helper scaling (1/2/3), ≥1 validation, non-integer rejection. Rewrote 40km acceptance scenario (2 helpers + difficult access + 14ft truck): new expected ₱14,970.67 (was ₱14,551.70 under flag model).

**FIX-008/009/010/011/012 (Vyela's pricing feedback)**
- FIX-008 (drop-off charge): engine already computed `extraDropoffsFee`; relabelled UI row "Extra drop-offs" → "Drop-off Charge".
- FIX-009 (condo→difficult access): full rename across schema, engine, types, actions, all UI, PDF. Migration `20260526000000_rename_condo_to_difficult_access`. Helper text: "Applies when access requires extra effort (stairs, elevator wait, parking restrictions, non-ground floor delivery)."
- FIX-010 (helper rate): 600 → 750 in seed + reset-defaults action (later removed entirely by per-helper refactor).
- FIX-011 (number-input clearing bug): refactored ~6 inputs in QuoteBuilderForm and ~15 in PricingConfigForm from `useState<number>` + clamp-on-change to `useState<string>` + parse-on-use. Added `SettingsDraft`/`TruckTypeRateDraft` types so the form holds strings while submission still serializes numbers.
- FIX-012 (distance + threshold): `distanceRatePerKm` 12 → 30; `longDistanceThresholdKm` 50 → 40. Seed + reset-defaults action + live DB.
- Cleaned 4 existing quotes + 4 bookings before the rename to avoid backwards-compat work on stored `pricingSnapshot` JSON.

**Code review found 15 findings; fixed the top high-severity ones**
- Silent ₱0-save guard: added `num()` zod preprocessor in `actions/pricing-config.ts` that maps empty/whitespace strings to `undefined` (which then fails coercion with "is required"). Without it, `z.coerce.number().nonnegative().safeParse('')` returned `{ success: true, data: 0 }` — clearing any rate field silently wrote 0.
- Truck base rates tightened from `.nonnegative()` to `.positive()` — a ₱0 base rate is always a misconfiguration.
- Client `emptyFields` memo in PricingConfigForm lists every cleared field (or zero truck-base-rate) by user-facing label. `canSave = isDirty && markupOk && !hasEmpty`. Save button disabled with explanatory tooltip; yellow warning banner above the form lists which fields to fix.
- Banner component extended with `warning` palette (amber).
- Action error reporter prefixes the field name (e.g. `dieselPricePerLiter: is required (cannot be empty)`).

**JWT FK error mapping (Vyela couldn't save quote)**
- Root cause: her browser's NextAuth JWT cookie held a `user.id` from before a past User-table reseed. The fresh `vyela` row exists with a different id, so `db.quote.create({ createdById: session.user.id })` threw P2003.
- Fix: `mapDbError()` helper in `src/actions/quotes.ts` catches `P2003` on `createdById` and returns "Your sign-in session is no longer valid (the user account it refers to is missing). Please log out and log back in, then retry." Other P2003s include the field name. All other errors get a generic message + `console.error(actualError)` for diagnosis. Applied to both `saveQuoteAction` and `updateQuoteAction`, replacing the prior silent `catch { return { error: "Failed to save quote." } }`.

**Payment Terms read-only**
- Was a freely-editable textarea in QuoteBuilderForm. Vyela: "should just be uneditable."
- Now renders as a tinted read-only block showing the PDF text. Hidden `<input name="paymentTerms" />` preserves submission. State setter removed (now a const).

**Cleanups**
- One-shot scripts in `scripts/` (`wipe-quotes-bookings.ts`, `rename-columns.ts`, `apply-new-defaults.ts`, `apply-drop-cols.ts`) executed then deleted.
- Dev server restarted, healthy at 181 MB RSS.

### 2026-05-24 — Send Email to Client + CompanyProfile + PDF contact details ⭐
- `CompanyProfile` singleton model (id=1): phone, mobile, email, address — 2 migrations applied
- `PaymentConfig` gains `companyProfileId Int @unique` FK (1:1 with CompanyProfile)
- `/company-profile` admin page (sidebar: Configuration → Company Profile); `updateCompanyProfileAction`
- `src/lib/generate-pdf.tsx` — shared `generateQuotePdf(quoteId): Promise<Buffer>`; PDF download route now a thin wrapper
- `sendQuoteEmailAction` in `src/actions/email.ts`: guards booking CONFIRMED/DISPATCHED/COMPLETED + client email; generates PDF via shared utility; sends via Resend (`noreply@sas-agent.co.uk`); email body has quote summary + payment details + CompanyProfile contact footer
- `SendEmailButton` component: AlertDialog confirmation + inline success/error; always visible on quote detail; disabled when unconfirmed or client has no email
- Quote detail page: `client.email` + `booking.status` added to query; `canSendEmail` logic; button in header (between Convert and Download PDF)
- `src/actions/payment-config.ts` fixed: `companyProfileId: 1` in upsert create fallback
- PDF footer: left = `phone · mobile · email`; right = `address` — both from CompanyProfile (live, not static)
- TSC clean, 30/30 tests pass

## 🧪 Experimental (treat as fragile)
_(none)_

## 🚫 Known Issues (Deprioritized)
- AUTH_TRUST_HOST=true in .env.local — dev server port no longer matters
- **Joleo_Update_Guide.md** — worked-example ₱ figure is outdated; correct value is ₱5,932.14 (confirmed by engine tests). Guide doc not yet updated.
- **Mobile responsiveness** — not yet implemented. Scoped: ~25 files, 3–4 sessions. Complex forms: Quote Builder + Booking Detail. Decision pending with Shem/Vyela.

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
| — | PDF Upgrades + PaymentConfig (Vyela) | ✅ Complete |
| — | Send Email to Client + CompanyProfile | ✅ Complete |
| — | FIX-008→012 + Per-Helper Markup + Reliability | ✅ Complete |
