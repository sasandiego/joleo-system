# Project: Joleo Transport Admin Portal

## What This System Does
Admin-only portal for Joleo Transport (Caloocan City trucking) letting 3 admin users manage masterlists, configure pricing rates, build client quotes with a real-time pricing engine, generate PDF quotations, and track bookings with a weekly truck availability calendar.

## Stack
Next.js 15.5 App Router · TypeScript 5 · React 19 · Tailwind v4 + shadcn/ui · Postgres 17 · Prisma 6 · Auth.js v5 Credentials · Zod · React Hook Form · TanStack Query v5 · @react-pdf/renderer · Vitest · Docker + Caddy 2 + Cloudflare Tunnel

**Currency rule:** Decimal.js in code, Postgres DECIMAL in storage. Never float. Locale: en-PH. Timezone: Asia/Manila.

## Module Map
- `src/features/pricing/engine.ts` → pure pricing engine; exposes: `computePrice(input, ctx): PricingResult`
- `src/features/booking/state-machine.ts` → booking FSM; exposes: `transitionBooking(id, toStatus, reason?)`
- `src/features/booking/availability.ts` → conflict detection; exposes: `checkConflict(truckId, date)`
- `src/features/quote/service.ts` → quote CRUD; exposes: `createQuote()`, `convertToBooking()`
- `src/features/auth/config.ts` → Auth.js config; exposes: `auth()`, `signIn()`, `signOut()`
- `src/lib/db.ts` → Prisma singleton; exposes: `db`
- `src/lib/format.ts` → formatting; exposes: `formatCurrency()`, `formatDate()` (en-PH, Asia/Manila)
- `src/lib/env.ts` → Zod-validated env; exposes: `env`
- `src/actions/` → Server Actions for all mutations

## Claude's Boundaries
### CAN do
- Modify logic inside modules following established patterns
- Add pages/components matching the mockup design system
- Add Server Actions following the existing action pattern
- Update seed data constants

### CANNOT do without asking
- Modify `prisma/schema.prisma` (requires migration review)
- Change `src/features/auth/config.ts`
- Add npm dependencies not in the locked stack
- Change the pricing engine formula

## Context Files
- `docs/ARCHITECTURE.md` — module map, data flows, key design decisions
- `docs/BUILD_PROGRESS.md` — current build state (overwrite each session)
- `docs/SYSTEM_HANDOFF.md` — current state + key decisions for safe continuation
- `docs/CONSTRAINTS.md` — hard rules and anti-patterns
- `build-guide/CLAUDE_CODE_BUILD_GUIDE.md` — the source-of-truth spec
- `build-guide/joleo_mockup.html` — the visual spec (every screen must match)

## Numbering Conventions
- Quotes: `QT-YYYYMMDD-NNNN` (NNNN resets daily per calendar date, Asia/Manila)
- Bookings: `JOL-YYYYMMDD-NNNN` (same pattern)
