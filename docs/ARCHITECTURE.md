# Architecture

## Data Flow
```
Browser → Server Action → Feature Service → Prisma → Postgres
                       ↓
                 Pricing Engine (pure, no DB)
```

## Key Design Decisions

### Pricing Engine is Pure
`src/features/pricing/engine.ts` has zero DB access. The caller (Server Action or route) resolves `RateSettings` and `TruckType` from DB and passes them as context. This makes the engine fully testable without mocking.

### Server Actions for Mutations
All data mutations go through `src/actions/`. No REST API routes except `/api/auth` and `/api/quotes/[id]/pdf`. TanStack Query wraps Server Actions for caching/invalidation.

### State Machine is the Only Booking Transition Path
`transitionBooking()` is the ONLY way to change booking status. Direct Prisma updates to `booking.status` are forbidden. All status changes write an AuditLog entry.

### Quote Number Generation
`QT-YYYYMMDD-NNNN` — sequence is per-day, counts existing quotes for that calendar date (Asia/Manila TZ) + 1. Same logic for `JOL-YYYYMMDD-NNNN` bookings. No global counter table needed.

### RateSettings is a Singleton
Only one row exists (id=1). The Rate Settings page always upserts id=1. Never insert a second row.

### Currency
All currency values use `Decimal.js` during computation. Stored as `DECIMAL(12,2)` in Postgres. Formatted for display with `formatCurrency()` (en-PH locale, ₱ symbol).

## Module Interfaces

| Module | Exposes |
|---|---|
| `pricing/engine.ts` | `computePrice(input: PricingInput, ctx: PricingContext): PricingResult` |
| `booking/state-machine.ts` | `transitionBooking(id, toStatus, reason?)`, `getAllowedTransitions(status)` |
| `booking/availability.ts` | `checkConflict(truckId, date): Promise<ConflictInfo \| null>` |
| `lib/db.ts` | `db: PrismaClient` (singleton) |
| `lib/format.ts` | `formatCurrency(n)`, `formatDate(d)`, `formatDateTime(d)` |
| `lib/env.ts` | `env: Env` (Zod-validated, throws at startup if invalid) |
