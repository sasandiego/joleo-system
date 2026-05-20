---
name: db-patterns
description: Use when touching the data layer — Prisma queries, Server Actions in src/actions/, page components that load data, or any code that handles currency, dates, or booking status. Loads Joleo's non-negotiable DB conventions.
---

# DB Patterns — Joleo

## Patterns to Always Follow

### Prisma singleton
- Import the shared client: `import { db } from "@/lib/db"`. Never `new PrismaClient()` in app code.
- All mutations go through Server Actions in `src/actions/` — never call `db.*` from client components.

### Currency = Decimal.js, never floats
- All currency computation uses `decimal.js`. Stored as `DECIMAL(12,2)` in Postgres.
- Never `parseFloat()`, `Number()`, `Math.round()`, or string concatenation for money.
- For rounding, use `Decimal.toDecimalPlaces(2)` — never `Math.round`.

### Decimal serialization at the server/client boundary
- Server components MUST call `.toNumber()` on Prisma `Decimal` fields before passing as props.
- Affects: `Driver.dailyRate/otRate`, `Helper.dailyRate/otRate`, `RouteArea.surcharge/estimatedToll`, all `RateSettings` Decimal fields, `Quote.finalPrice`, `Booking.quotedAmount/finalAmount`.
- Client components must receive `number`, not `Decimal`.

### Display formatting goes through `formatCurrency()` / `formatDate()`
- `src/lib/format.ts` exposes `formatCurrency(n)`, `formatDate(d)`, `formatDateTime(d)`, `formatTime(d)`.
- Locale: `en-PH`. Timezone: `Asia/Manila`. Currency: `PHP` with ₱ symbol.
- Do NOT reimplement formatting inline with `Intl.NumberFormat` — call the helper.

### RateSettings is a singleton (id = 1)
- Only one row ever exists. The Rate Settings page always upserts on `id: "1"`.
- Never `db.rateSettings.create()` without an explicit id check — always upsert.

### Booking status transitions = FSM only
- Status changes ONLY via `transitionBooking()` (or `transitionBookingAction`) in `src/features/booking/state-machine.ts`.
- States: `DRAFT → QUOTED → CONFIRMED → DISPATCHED → COMPLETED`. `CANCELLED` reachable from any non-terminal.
- Every transition writes an `AuditLog` entry.
- NEVER `db.booking.update({ data: { status: ... } })` directly.

### Quote / Booking number generation
- Format: `QT-YYYYMMDD-NNNN` (Quote), `JOL-YYYYMMDD-NNNN` (Booking).
- `YYYYMMDD` is the calendar date in **Asia/Manila**, not UTC.
- `NNNN` is the per-day sequence (count existing rows for that date + 1, padded to 4 digits).
- No global counter table — use `db.quote.count({ where: { quoteNo: { startsWith: ... } } })`.

### Schema gotchas (the easy-to-miss ones)
- `Driver.fullName` / `Helper.fullName` — NOT `name`.
- `RouteArea.label` — NOT `name`.
- `Quote.truckTypeId` and `Quote.routeAreaId` exist but have **no `@relation`** on the Quote model. Cannot use Prisma `include` for these — issue a separate query if you need the related record.
- `User.username` not `email`.

## Anti-Patterns to Never Use

- `parseFloat()` / `Number()` on currency values
- `Math.round()` on money
- Direct `booking.status = ...` updates
- `db.rateSettings.create({ ... })` without checking for id=1
- Calling `db.*` from client components or inside hooks
- Hardcoding `₱` + `.toLocaleString()` instead of calling `formatCurrency()`
- Using `Date.now()` or `new Date().toISOString()` for the calendar date in quote/booking numbers — must be Asia/Manila

## When in doubt

- Check `docs/CONSTRAINTS.md` for hard gates.
- Check `docs/ARCHITECTURE.md` for module contracts.
- Check `docs/SYSTEM_HANDOFF.md` "Active Gotchas" for current known issues.
