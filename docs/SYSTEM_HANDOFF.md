# SYSTEM_HANDOFF

## Last Updated
2026-05-19 — M4 complete

## Current System State
Next.js 15.5 app, `pnpm build` clean, all 13 routes compile. M1–M4 complete and pushed to GitHub (`main`). DB seeded with real mockup data. Login with `jess` / `admin123` (or whichever credentials are in `.env.local`). All masterlist CRUD pages and rate settings page are working.

**Next milestone: M5 — Pricing Engine** (highest risk — pure TypeScript, must match Excel output to ±₱0.01)

---

## Architecture Snapshot

### App routes (`src/app/`)
- `(auth)/login/page.tsx` — two-column mockup layout, LoginForm client component
- `api/auth/[...nextauth]/route.ts` — Auth.js handlers
- `(admin)/layout.tsx` — grid: 240px Sidebar + main; reads session from auth()
- `(admin)/dashboard/page.tsx` — stub stat card placeholders
- `(admin)/trucks/page.tsx` — trucks list, includes truckType, no Decimal serialization needed
- `(admin)/drivers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/helpers/page.tsx` — serializes dailyRate/otRate .toNumber()
- `(admin)/clients/page.tsx` — no Decimal fields
- `(admin)/route-areas/page.tsx` — serializes surcharge/estimatedToll .toNumber()
- `(admin)/rate-settings/page.tsx` — serializes all Decimals + pct fields × 100 for display
- `(admin)/users/page.tsx` — users list, no Decimals

### Components (`src/components/`)
- `layout/Sidebar.tsx` — nav-dot items (no icons), "Transport · Admin", active state via usePathname
- `layout/PageHeader.tsx` — reusable page header (title + subtitle + children slot)
- `auth/LoginForm.tsx` — useActionState + useFormStatus
- `users/ResetPasswordDialog.tsx` — Radix Dialog
- `trucks/TruckListClient.tsx` + `TruckDialog.tsx`
- `drivers/DriverListClient.tsx` + `DriverDialog.tsx`
- `helpers/HelperListClient.tsx` + `HelperDialog.tsx`
- `clients/ClientListClient.tsx` + `ClientDialog.tsx` + `ToggleClientButton.tsx`
- `route-areas/RouteAreaListClient.tsx` + `RouteAreaDialog.tsx`
- `rate-settings/RateSettingsForm.tsx` — full settings form + change log dialog

### Actions (`src/actions/`)
- `auth.ts` — loginAction, signOutAction
- `users.ts` — resetPasswordAction (bcrypt 12 rounds, writes AuditLog)
- `trucks.ts` — upsertTruckAction
- `drivers.ts` — upsertDriverAction
- `helpers.ts` — upsertHelperAction
- `clients.ts` — upsertClientAction, toggleClientStatusAction
- `route-areas.ts` — upsertRouteAreaAction
- `rate-settings.ts` — updateRateSettingsAction (writes AuditLog with before/after)

### Features / Lib
- `src/features/auth/config.edge.ts` — edge-safe NextAuth config (no Prisma, for middleware)
- `src/features/auth/config.ts` — full NextAuth config with bcryptjs + Prisma
- `src/middleware.ts` — protects all routes via edge config
- `src/lib/db.ts` — Prisma singleton
- `src/lib/env.ts` — Zod-validated env vars
- `src/lib/format.ts` — formatCurrency (en-PH), formatDate (Asia/Manila)
- `src/lib/utils.ts` — cn() utility
- `src/types/next-auth.d.ts` — session/user/JWT type augmentation

### Schema models (all in `prisma/schema.prisma`)
- User, TruckType, Truck, Driver, Helper, Client, RouteArea — all seeded
- RateSettings — singleton (id=1), seeded with values from PRICING_MATRIX
- Quote, Booking, BookingHelper, AuditLog — schema only, not yet used

---

## Key Decisions

### Decision: Pricing engine (M5 critical)
- Engine must live at `src/features/pricing/engine.ts` as a **pure function** — no DB access
- Caller resolves `RateSettings` and `TruckType` from DB, passes them into `computePrice(input, ctx)`
- Pct fields in DB are fractions (0.05 = 5%). Engine receives raw fractions — do NOT multiply by 100 inside engine
- `src/features/pricing/engine.test.ts` — Vitest parity tests; must match Excel to ±₱0.01
- Reference test case from build guide: 14FT_6W (V6), 60 km, 1 helper, no flags → target ~₱18,532

### Decision: No backup service in Phase 1
- Deferred; docker-compose has 4 services (postgres/web/caddy/cloudflared), no backup
- Will be added post-Phase 1 polish

### Decision: Quote/Booking number format
- QT-YYYYMMDD-NNNN / JOL-YYYYMMDD-NNNN, sequence resets daily (Asia/Manila TZ)
- User requested date-identifiable format

### Decision: Tailwind v4 CSS-based config
- Brand tokens in @theme block inside globals.css — no tailwind.config.js
- Do NOT add tailwind.config.js

### Decision: Auth.js v5 split config
- `config.edge.ts` (no Prisma) for middleware, `config.ts` (with Prisma) for API + server components
- Middleware: `import NextAuth from "next-auth"; export default NextAuth(authConfigEdge).auth`

### Decision: Rate Settings pct field convention
- Stored in DB as fractions: 0.05 = 5%, 0.15 = 15%
- Page serializes: `raw.fuelSurchargePct.toNumber() * 100` → form shows `5`
- Action receives `5` from form → divides by 100 → stores `0.05`
- Engine receives raw fractions directly from DB

### Decision: Decimal serialization at server/client boundary
- Prisma Decimal objects cannot cross server→client boundary in Next.js
- Pattern: call `.toNumber()` in the server page component before passing as props
- Applies to: Driver, Helper (dailyRate, otRate), RouteArea (surcharge, estimatedToll), RateSettings (all Decimal fields)

---

## Active Gotchas
- Tailwind v4: `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` in postcss.config.mjs
- Auth.js v5: package is `next-auth@beta`; AUTH_TRUST_HOST=true in .env.local (not NEXTAUTH_URL)
- `jose` v6 logs Edge Runtime CompressionStream warnings — harmless, known upstream issue
- `env.ts` validates at startup — missing required var = app won't start
- Sidebar uses inline styles (not Tailwind classes) for SSR brand var consistency
- All Dialog components use `@radix-ui/react-dialog` — already installed
- After `pnpm db:seed` re-run: safe (all upserts)

---

## Next Steps (M5 — Pricing Engine)

### Files to create
- `src/features/pricing/types.ts` — PricingInput, PricingContext, PricingResult, LineItem types
- `src/features/pricing/engine.ts` — pure `computePrice(input, ctx): PricingResult`
- `src/features/pricing/engine.test.ts` — Vitest parity tests (5+ cases vs Excel)

### Engine input shape
```typescript
interface PricingInput {
  truckTypeId: string;
  estimatedDistanceKm: number;
  estimatedHours: number;
  numberOfHelpers: number;
  numberOfDropoffs: number;
  condoService: boolean;
  cateringService: boolean;
  nightDelivery: boolean;
  additionalHelper: boolean;
  outOfTown: boolean;
  longDistance: boolean;
  tollFee: Decimal;
  parkingFee: Decimal;
  fuelPriceOverride?: Decimal;
  discountAmount: Decimal;
  vatOption: VatOption;
}

interface PricingContext {
  truckType: TruckType;     // from DB, Decimal fields intact
  settings: RateSettings;   // from DB, Decimal fields intact
}
```

### Key formula reference (from build guide)
- Step 1: Truck base rate (from TruckType.minBaseRate)
- Step 2: Fuel cost = distance / fuelKmPerLiter × dieselPrice × (1 + fuelSurchargePct)
- Step 3: Driver cost = driverDailyRate + OT hours × driverOtRate
- Step 4: Helper cost = numberOfHelpers × (helperDailyRate + OT × helperOtRate)
- Steps 5–13: Add applicable surcharges/fees (condo, catering, dropoffs, night, waiting, distance, out-of-town, long-distance)
- Step 14: Toll + parking pass-through
- Step 15: Direct cost = sum of steps 1–14
- Step 16: Maintenance = direct × maintenancePctOfBase
- Step 17: Overhead = direct × overheadPctOfDirect
- Step 18: Contingency = direct × contingencyPctOfDirect
- Step 19: Total cost = steps 15–18
- Step 20–22: Apply margin (floor/target/ceiling) → floor price, target price, ceiling price
- Step 23: Apply discount
- Step 24: VAT handling (VAT_INCLUSIVE / VAT_EXCLUSIVE / NON_VAT)
- Step 25: Final price

### Test case from build guide
- Truck: 14FT_6W (V6), minBaseRate=4500, fuelKmPerLiter=5.0, excessHourRate=200
- Distance: 60 km, Hours: 8 (no OT), 1 helper, no special flags, diesel=70, fuelSurcharge=5%
- Expected target price: ~₱18,532 (use this to verify engine is correct)
