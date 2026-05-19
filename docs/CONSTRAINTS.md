# Constraints

## Hard Gates (always require human review)
- Any change to `prisma/schema.prisma` after initial creation
- Any change to `src/features/auth/config.ts`
- Any change to the pricing engine formula in `src/features/pricing/engine.ts`
- Adding npm dependencies not in the locked stack (see build guide Section 2)
- Pushing to production / running `docker compose up` on the Nucbox

## Patterns to Always Follow
- All booking status transitions via `transitionBooking()` only — no direct Prisma status updates
- All mutations go through Server Actions in `src/actions/`
- All currency computation uses `Decimal.js` — never `number` arithmetic for money
- All DB writes to RateSettings use upsert on id=1
- Quote numbers: `QT-YYYYMMDD-NNNN`, Booking numbers: `JOL-YYYYMMDD-NNNN` (daily sequence, Asia/Manila)
- Passwords always hashed with bcrypt (12 rounds)
- Dates always formatted with Asia/Manila timezone

## Anti-Patterns to Never Use
- `parseFloat()` or `Number()` on currency values
- `Math.round()` on money — use `Decimal.toDecimalPlaces(2)` 
- Direct `booking.status = ...` without state machine
- Raw stack traces exposed to the browser
- Customer portal features (Phase 2, parked)
- Floating-point currency storage

## Stack Locks
Stack is locked in build guide Section 2. Do not substitute:
- Do NOT replace TanStack Query with SWR/React Query (different package)
- Do NOT replace shadcn/ui with another component library
- Do NOT add Prisma-incompatible DB features (keep SQLite-theoretically-portable)
