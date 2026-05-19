---
name: joleo-build-state
description: "Joleo build state snapshot — all Phase 1 milestones complete, key architectural decisions to remember"
metadata: 
  node_type: memory
  type: project
  originSessionId: 69dcdbc1-66d8-4654-88d8-5291b1e62c82
---

**Last build state: 2026-05-19 — Phase 1 complete (M1–M10). All pushed to `main`.**

## What's built

| Route | Status |
|---|---|
| /login, /dashboard | ✅ Live with real data |
| /trucks, /drivers, /helpers, /clients, /route-areas | ✅ Full CRUD |
| /rate-settings | ✅ 25-field form, AuditLog change log |
| /quotes, /quotes/new, /quotes/[id] | ✅ Live pricing, save/convert, PDF download |
| /bookings, /bookings/new, /bookings/[id] | ✅ FSM transitions, assignment form, conflict detection |
| /calendar | ✅ Week grid, truck × day, color-coded blocks |
| /api/quotes/[id]/pdf | ✅ @react-pdf/renderer, auth-guarded |

## Critical decisions to not break

- **Pricing engine formula is locked.** Excel had broken cell refs for steps 1 & 16. Engine INCLUDES both — corrected target = ₱18,532 for V6/100km reference case. Do NOT change without explicit business request.
- **Pct fields stored as fractions** (0.05 = 5%). Page ×100 for display; action ÷100 before save; engine receives raw fractions.
- **Decimal serialization:** Call `.toNumber()` at server/client boundary — never pass Prisma Decimal objects to client components.
- **Auth.js v5 split config:** `config.edge.ts` (no Prisma, for middleware) + `config.ts` (full, for API/server components). `AUTH_TRUST_HOST=true` in .env.local.
- **Driver/Helper field name is `fullName`**, not `name`. Easy to get wrong.
- **RouteArea field is `label`**, not `name`.
- **Quote has `truckTypeId` but no `@relation`** in Prisma schema — must do a separate query for truckType in quote detail pages.
- **Booking state machine** in `src/features/booking/state-machine.ts`: DRAFT → QUOTED → CONFIRMED → DISPATCHED → COMPLETED. CANCELLED reachable from any non-terminal. All status changes must go through `transitionBookingAction`.

## Test reference
Run `pnpm test --run` → should be 41/41. If broken, the pricing engine formula was changed.
Manual test guide: `TEST_GUIDE.md` in repo root.

**Why:** These are the non-obvious gotchas that caused build errors in the original session. Knowing them prevents repeat mistakes.

**How to apply:** Before editing any pricing logic, booking actions, or Prisma queries involving Driver/Helper/RouteArea, check these constraints first.
