# SYSTEM_HANDOFF

## Last Updated
2026-05-24 — Obsidian Trucking vault documented + Joleo Transport 6-month marketing plan finalized (no code changes)

## Current System State
Next.js 15.5 app, `pnpm exec tsc --noEmit` clean, `pnpm test --run` 30/30 green. All Phase 1 milestones (M1–M10) + 6-phase pricing engine refactor + Phase 1.5 (Clients & AI) complete, all on `main`. Full feature set: auth, masterlists CRUD, pricing config, pricing engine (bottom-up), quote builder + editor + PDF with AI generation, bookings with FSM + convert-from-quote, truck availability calendar, live dashboard, sidebar Logout. Login with `vyela` / `admin`, `gina` / `admin`, or `shem` / `admin`.

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
- `(admin)/payment-config/page.tsx` — Payment Details config (singleton PaymentConfig; bank × 2 + GCash)
- `api/quotes/[id]/pdf/route.tsx` — fetches PaymentConfig + passes to QuotationPDF

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
- `pdf/QuotationPDF.tsx` — @react-pdf/renderer A4 document; Payment Terms + Payment Details (bank/GCash) + Conforme; tightened spacing for single-page guarantee
- `payment-config/PaymentConfigForm.tsx` — editable form, 3 method cards (Bank 1, Bank 2, GCash)
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
- `payment-config.ts` — updatePaymentConfigAction (upsert PaymentConfig singleton)

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
- Toll is included in base costs — same markup + VAT treatment as all other costs: `base_costs = fuel + tripBase + distance + other + toll` (finalized 2026-05-23)
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

### Decision: Client model — 3-way type + auto-gen codes (2026-05-22)
- Renamed `Client.companyName` → `Client.clientName` (holds person OR trade OR company name)
- Renamed `Client.businessType` → `Client.type`
- Replaced enum `ClientBusinessType (INDIVIDUAL | CORPORATION)` with `ClientType (INDIVIDUAL_PERSON | INDIVIDUAL_BUSINESS | CORPORATION_BUSINESS)`
- Rationale: PH context has both walk-in private persons (one-off house movers, no TIN) AND sole proprietorships (e.g. DESKARTE DESIGN — has TIN and trade name). Lumping them as "INDIVIDUAL" lost that distinction.
- Form adapts per type: name label ("Full Name" / "Trade Name" / "Company Name"), TIN shown only for business types, address label varies. Contact Person shown for all three (the person-in-charge can differ from the client).
- Client codes are now system-generated `CL-NNNN` (4-digit zero-padded, sequential by `createdAt`). Read-only in the dialog; never editable. The `upsertClientAction` generates the code on create and never touches it on update.
- Migration: `20260522160000_client_type_three_way` (existing INDIVIDUAL → INDIVIDUAL_BUSINESS, CORPORATION → CORPORATION_BUSINESS; old `BB-C`/`CASH-NNN`/`LV-001` codes wiped and re-assigned `CL-0001`…`CL-0034`)

### Decision: Quote schema — separate notes vs serviceDescription + required schedule (2026-05-22)
- `Quote.notes` is admin-only internal (client requests, ops reminders). Never on PDF.
- `Quote.serviceDescription` is the client-facing paragraph on the PDF. AI-generated from Notes + other form fields.
- `Quote.scheduledDate` is REQUIRED on the form (nullable in DB for backward compat). `Quote.scheduledStartTime` optional.
- Convert-to-booking now copies these into the Booking row instead of defaulting `scheduledDate` to today.
- Migration: `20260522150000_quote_notes_and_schedule`

### Decision: Route/Area removed from UI, kept in DB (2026-05-22)
- Dropped from Quote Builder form, PDF, sidebar nav
- `/route-areas` admin page and `Client.routeAreaId` schema column still exist (zero-risk parking; can revisit if zone-based pricing/reporting becomes useful)
- Reason: never drove pricing (estimatedDistanceKm + longDistanceThresholdKm did all the work). Pick-up + Drop-off free text already conveyed the route on PDF.

### Decision: AI features via LiteLLM gateway "smart" alias → Haiku 4.5 (2026-05-22)
- `src/lib/ai.ts` — pure `fetch` wrapper for OpenAI-compatible LiteLLM endpoint. No SDK.
- Env: `LITELLM_BASE_URL=http://localhost:4000`, `LITELLM_API_KEY=sk-litellm-m5agent-sven`, `LITELLM_MODEL=smart`
- The `smart` alias is configured in `/home/agent/gateway/litellm_config.yaml` → `claude-haiku-4-5-20251001`. Other aliases available: `fast`, `smartest`, `gemini-fast`, `gemini-smart`, `openai-fast`, `openai-smart`, `agentic`.
- Two server actions in `src/actions/ai-quotes.ts`:
  - `generateServiceDescriptionAction` — 2–3 sentence client-facing description from service/route/truck/helpers/billing/notes. Notes get explicit "translate into client-appropriate language; do not quote verbatim" instruction so internal phrasing stays internal.
  - `generateClientMessageAction` — 3–4 sentence SMS/Viber draft with quote number, route, total, confirm/reply prompt.
- All AI actions have try/catch fallback returning `{ error: "...you can type it manually" }` so failures don't block workflow.

### Decision: Service Description placement = right panel above Price Breakdown (2026-05-22)
- Was inside Section A's "Booking Information" block originally. Awkward because the AI consumes Section B (Truck & Crew) data too, so users had to scroll down then back up to generate.
- Moved to the sticky right column above PriceBreakdownPanel. Form flows naturally top-to-bottom on left (A → B → C), then right panel collects the generated description and shows live pricing.
- Notes (internal) stays in Section A so the admin keeps it with the other booking-context fields.

### Decision: Convert to Booking from quote detail page (2026-05-22)
- `convertQuoteToBookingAction(formData)` in `src/actions/quotes.ts`
- Signature is `Promise<void>` — uses `throw new Error(...)` instead of `return { error }` (server-component form actions can't return objects). Errors hit Next.js's error boundary.
- Button on `/quotes/[id]` header between Edit and Download PDF, hidden once `quote.booking` exists
- If a booking already exists for this quote, redirects to it (no duplicate)
- Refuses to convert if `scheduledDate` is null with a clear error

### Decision: Client form validation — live sanitize + onBlur reformat + Zod (2026-05-22)
- **Live (`onChange`):** `sanitizePhone()` strips everything except `0-9 + - space ( )` from mobile/landline; `sanitizeEmail()` strips whitespace from email. Letters can't even appear in phone fields.
- **Blur (`onBlur`):** `formatMobileOnBlur()` auto-normalizes recognised PH shapes — `09171234567` → `0917-123-4567`, `+639171234567` → `+63 917 123 4567`. `formatLandlineOnBlur()` trims and collapses whitespace. Email lowercases + trims.
- **Server (Zod):** `PH_MOBILE_RE = /^(?:\+?63|0)9(?:[\s-]?\d){9}$/`. `PH_LANDLINE_RE = /^[\d\s\-+()]{7,18}$/`. Email via `z.string().email()`.
- **HTML `pattern` attribute removed** — modern browsers compile it with the `/v` regex flag which has stricter character-class rules (`(`, `)`, hyphen-positioning). Tooltips via `title=""` still show expected format. The 3-layer defense above is sufficient.

### Decision: React 19 form-reset workarounds in ClientDialog (2026-05-22)
- `<form action={serverAction}>` calls native `form.reset()` after the action completes, even on error.
- For text inputs: convert to controlled state (`value={state}` + `onChange`). State survives the reset; on next render React re-fills the DOM from state.
- For `<select>`: same controlled approach doesn't quite work — there's a reconciliation quirk where the select value can still revert. Workaround: decouple the select from form submission via a hidden input (`<input type="hidden" name="paymentTerms" value={state} />`) and remove `name=""` from the select so it's purely UI. The hidden input always renders fresh from state.
- `useEffect` re-syncs all state from `client?` props on dialog open (`[open, client?.id]` deps) — Add reopens clean; Edit reopens with current data.

### Decision: Radix Dialog `aria-describedby={undefined}` on all dialogs (2026-05-22)
- Radix v1+ requires either a `<Dialog.Description>` child or explicit opt-out via `aria-describedby={undefined}` on `<Dialog.Content>`. Otherwise prints a console warning.
- Applied to all 5 dialogs: Client, Driver, Helper, Route Area, Reset Password.

### Decision: paymentTerms moved from Client → Quote (2026-05-23, Vyela)
- `Client.paymentTerms` removed; `Quote.paymentTerms` added (Text, nullable)
- Default pre-fill in Quote Builder Section C: "20% downpayment required to confirm booking (non-refundable, non-cancellable but re-bookable). Accepted payment methods: Cash, Bank Transfer, GCash Send Money."
- Admin can edit freely per quote; rendered as "Payment Terms" section in PDF
- Migration: `20260523000000_quote_payment_terms`; 12+ files updated

### Decision: PaymentConfig singleton for bank/GCash details on PDF (2026-05-23, Vyela)
- New model `PaymentConfig` (id=1 singleton): bank1, bank2, GCash fields
- Seeded: EastWest Bank 200048853462 / BDO Unibank 013208001304 / GCash Leovina Salvador 09178305652
- Admin page `/payment-config` (sidebar: Configuration → Payment Details)
- PDF fetches live on each download — changes apply immediately to new PDFs
- Rendered as 3-column shaded cards in "Payment Details" section

### Decision: PDF Conforme section (2026-05-23, Vyela)
- Standard PH conforme block at PDF bottom: acknowledgment note + 3 signature lines (Signature/Printed Name · Position/Title · Date)
- PDF spacing tightened throughout (paddingTop 32→24, section margins, row padding) to maintain single-page layout

### Decision: Calendar Quoted status color + truck sort order (2026-05-23)
- QUOTED gets amber (#B8801C) — was sharing white/dashed style with DRAFT (invisible on calendar)
- Trucks sorted by best booking status this week: DISPATCHED→CONFIRMED→QUOTED→DRAFT→unbooked; ties by code

### Decision: Calendar truck rows sorted by booking status priority (2026-05-23)
- `sortedTrucks` derived in `TruckCalendar.tsx`; rank: DISPATCHED=0, CONFIRMED=1, QUOTED/DRAFT=2, unbooked=3
- Ties fall back to truck code alphabetical
- Solves the "scroll to bottom to find active bookings" UX problem

### Decision: Quoted status has distinct amber color in calendar (2026-05-23)
- QUOTED: `bg var(--warning) #B8801C`, white text, solid border — distinct from CONFIRMED (maroon) and DISPATCHED (ink)
- Previously QUOTED shared the white/dashed style with DRAFT — invisible when active quotes appeared on the calendar
- `isDashed` now only applies to DRAFT (QUOTED is solid — it has a committed quote behind it)
- Legend updated and reordered: Dispatched → Confirmed → Quoted → Draft → Unavailable (priority order)

### Decision: Toll fee in base costs (2026-05-23, finalized)
- Iterated through 3 approaches this session:
  1. Post-VAT pass-through (original) — no markup, no VAT on toll
  2. Added to VAT base — no markup, but VAT applied on toll
  3. **Base costs (final, per Shem)** — toll treated identically to all other costs
- Final formula: `base_costs = fuel + tripBase + distance + other + toll`; `revenue = base_costs / (1 - markup)`; `finalPrice = revenue + (revenue × vatRate)`
- Override back-compute simplifies completely: `effectiveRevenue = override / (1 + vatRate)` — no toll subtraction needed
- UI label: "Toll" (no "pass-through" language) in PriceBreakdownPanel, quote detail page, PDF
- `result.tollFee` still returned in PricingResult as the raw input amount (for display reference)
- 30/30 tests updated and passing; all pushed to origin/main

### Decision: Booking assignment form — `onSubmit` + manual FormData (2026-05-23)
- Root cause: `<form action={serverAction}>` calls native `form.reset()` after completion; React 19 reconciliation then reverts controlled selects to their last server-rendered value
- Definitive fix: `<form onSubmit={handleAssignSubmit}>` where `handleAssignSubmit` calls `e.preventDefault()`, builds FormData from React state directly, calls server action via `startTransition`
- This is immune to all form reset behavior — state is authoritative, DOM is never reset by the form lifecycle
- `useActionState` kept only for status transition buttons; assignment form uses `useState + useTransition`

### Decision: Driver conflict detection mirrors truck conflict (2026-05-23)
- `checkDriverConflict(driverId, date, excludeBookingId?)` in `src/actions/bookings.ts`
- Same pattern as `checkTruckConflict`: queries bookings by driverId + date, excludes current booking ID
- Wired into: `transitionBookingAction` (on CONFIRMED), `updateBookingAssignmentAction`, `createBookingAction`
- Error message: `"Driver ${fullName} is already assigned to booking ${bookingNo} on ${dateStr}"`

### Decision: Price recomputation history via AuditLog (2026-05-23)
- When `updateBookingAssignmentAction` saves a `recomputedAmount`, it writes `action: "BOOKING_PRICE_UPDATED"` to AuditLog
- `before`: `{ quotedAmount: old, truckType: oldLabel }` — `after`: `{ quotedAmount: new, truckType: newLabel, username }`
- Username stored in JSON payload (not a Prisma relation — AuditLog has no `user` FK)
- Booking detail page fetches history (`db.auditLog.findMany({ action: "BOOKING_PRICE_UPDATED" })`), renders as Price History card (descending, Asia/Manila timestamps)

### Decision: Booking End Time auto-computed from estimatedHours (2026-05-23)
- `handleStartTimeChange` in BookingDetailClient: if `booking.estimatedHours` is set and input is a valid HH:MM, adds hours to start time and fills End Time field
- Pure client-side arithmetic — no round-trip; user can still manually override End Time after
- End Time is stored as a plain HH:MM string in `scheduledEndTime`; no timezone conversion

### Decision: Quotes list Date & Time column shows scheduled date, not createdAt (2026-05-23)
- `quotes/page.tsx` serializes `scheduledDate` and `scheduledStartTime` alongside `createdAt`
- `QuoteListClient` renders scheduled date + time; falls back to `createdAt` for pre-Phase-1.5 quotes that have no `scheduledDate`
- `formatSchedule()` helper in `QuoteListClient` handles HH:MM → 12-hour conversion client-side

### Decision: Bookings list — clickable Booking ID + time display (2026-05-23)
- `bookingNo` is now a maroon Link to `/bookings/[id]` (same pattern as Quote No. in quotes list)
- Date column shows `scheduledStartTime` as a muted second line when set

### Decision: Booking Detail — quoted truck type visible + assignment guard (2026-05-23)
- Booking serialization includes `quotedTruckTypeId` and `quotedTruckTypeLabel` (label resolved server-side from the trucks array; null if booking has no quote or no active truck of that type exists)
- "Quoted Truck Type" DetailRow added to the Booking Information card — always visible before the assignment form
- Truck dropdown options show: `{code} — {plateNo} · {truckTypeLabel}`
- ⚠ mismatch warning shown under the dropdown only when the currently-assigned truck's type ≠ quoted type

### Decision: `trucks/page.tsx` must explicitly serialize TruckType Decimal fields (2026-05-23)
- `db.truckType.findMany()` returns `eightHourBaseRate`, `perTripBaseRate`, `dailyRate`, `excessHourRate` as Prisma Decimal class instances
- These were being passed raw to `TruckListClient` ("use client"), causing "Only plain objects can be passed to Client Components — Decimal objects are not supported" RSC error
- Fix: explicit `.map()` with `.toNumber()` for all Decimal fields on both `trucks` and `truckTypes` arrays before passing to client; `TruckListClient` types updated from `unknown` → `number`
- All other pages (drivers, helpers, route-areas) were already serializing correctly; trucks was the only miss

### Decision: Sidebar Logout button (2026-05-22)
- `signOutAction` existed in `src/actions/auth.ts` but had no UI trigger. Added a small "Logout" button to the sidebar footer next to the user info card.
- Uses `<form action={signOutAction}>` — works from a client component because signOutAction is "use server".

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
- **JWT session staleness:** Auth.js v5 stores user.id in the JWT cookie. If the User table is reseeded, old browser sessions reference dead user IDs → `Foreign key constraint violated on Quote_createdById_fkey` on save. Fix: user must log out and back in (now possible via the new sidebar Logout button).
- **HTML5 `pattern` attribute** compiles with `/v` flag in modern browsers: `(`, `)`, and certain hyphen positions inside character classes throw `Invalid character in character class`. Use live JS sanitization + onBlur reformat + server-side Zod regex instead.
- **React 19 form-action reset behavior:** uncontrolled inputs lose their values after `<form action={serverAction}>` completes (even on error). Controlled state survives — but native `<select>` still has reconciliation quirks; use hidden input + UI-only select.
- **Schema changes need dev-server restart:** `prisma generate` updates the client on disk, but Turbopack caches the OLD module in memory. Renaming/removing fields → kill `next dev`, `rm -rf .next`, restart.
- **`@react-pdf/renderer` italic:** `fontStyle: "italic"` requires an italic font variant registered via `Font.register`. We only ship DejaVu Regular and Bold, so do NOT use `fontStyle: "italic"` anywhere in `QuotationPDF.tsx` unless you add `DejaVuSans-Oblique.ttf` to `public/fonts/` and register it.

---

## Session Continuity (2026-05-24)
- Last worked on: Non-code session — Obsidian Trucking vault fully updated (`Project-Trucking.md`, `Context-Trucking.md`); Joleo Transport 6-month marketing plan finalized from Vyela's PPTX strategy deck and saved to `/home/agent/vault/04 Projects/Trucking/notes/Marketing-Plan.md`.
- **Immediate next step (marketing):** Start Week 1 quick wins — Anica: TikTok setup + Facebook page refresh; Shem: list 50 target manufacturers in Caloocan/Valenzuela/Bulacan corridor; Gina: verify PaymentConfig is correct in admin portal (bank accounts + GCash).
- **Immediate next step (system):** Live browser test on `joleo.sas-agent.co.uk` — download a PDF from an existing quote to verify Conforme + Payment Terms + Payment Details render correctly on one page. (Carried over from 2026-05-23 — not yet done.)
- **Pending decision:** Mobile responsiveness — Shem/Vyela thinking it over. Scope: ~25 files, 3–4 sessions. Complex forms = Quote Builder + Booking Detail; everything else straightforward.
- **Open items:**
  - `docs/Joleo_Update_Guide.md` worked-example ₱ figure still outdated; correct value is ₱5,932.14.
  - Walk-in `walkInName` column still on Quote/Booking — unused but harmless.
  - Italic Service Description on PDF — can re-add by registering `DejaVuSans-Oblique.ttf` in `public/fonts/`.
- **Not blocked:** TSC clean, 30/30 tests pass, dev server healthy on `localhost:3000`.
- Do NOT touch:
  - `/etc/cloudflared/config.yml` and other ingress entries on the Nucbox
  - Font system (must stay on Google Fonts CDN per user directive)
  - `import React from "react"` in `QuotationPDF.tsx` (required by @react-pdf/renderer reconciler)
  - DejaVu font files in `public/fonts/`
  - `pnpm-workspace.yaml` `allowBuilds:` booleans
  - HTML `pattern` attribute — re-adding it crashes modern browsers under `/v` flag

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
