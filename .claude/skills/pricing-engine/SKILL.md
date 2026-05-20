---
name: pricing-engine
description: Use when touching src/features/pricing/ (engine.ts, types.ts, engine.test.ts), adding pricing flags, modifying RateSettings shape, debugging quote totals, or anything that affects ₱ values in quotes. The engine formula is LOCKED — this skill loads the constraints.
---

# Pricing Engine — Joleo

The pricing engine is the single most load-bearing piece of business logic in Joleo. It mirrors a hand-tuned Excel sheet and was validated against 41 vitest parity cases. **Treat it as locked.**

## Patterns to Always Follow

### The engine is pure — no DB, no side effects
- `src/features/pricing/engine.ts` exports `computePrice(input, ctx): PricingResult`.
- Zero DB access. Zero `await`. Zero `fetch`. Caller (Server Action or page component) resolves `RateSettings` and `TruckType` from DB and passes them as `ctx`.
- Tests mock `ctx` directly with plain objects — no Prisma in `engine.test.ts`.

### Decimal.js throughout the engine
- Every intermediate value is a `Decimal`. No `number` arithmetic in the engine body.
- Final output values get `.toDecimalPlaces(2)` for ₱ amounts.

### Pct fields are stored as fractions
- `RateSettings.overheadPct = 0.10` means 10%, not 10.
- The engine receives the raw fraction directly from DB — do NOT multiply by 100 before passing.
- Only the Rate Settings **page** multiplies by 100 for display, and the **action** divides by 100 before saving.
- The Page ↔ Engine convention is: page does ×100/÷100; engine and DB are in fractions.

### The 18-step computation INCLUDES steps 1 and 16
- The original Excel had broken cell refs for step 1 (truck base rate) and step 16 (maintenance allowance) — both showed 0 in the spreadsheet.
- Joleo's engine corrects this and includes both. The corrected V6 reference case (100 km, 2 helpers, condo service, out-of-town) targets **₱18,532** — not the Excel's ₱11,209.60.
- Do NOT "fix" the engine to match the broken Excel without an explicit business request.

### Context interface, not Prisma types
- `TruckTypeForPricing` and `RateSettingsForPricing` use structural `{ toNumber(): number }` typing for Decimal fields.
- Prisma model objects satisfy these directly — no `.toNumber()` conversion at the call site.
- Tests use `new Decimal(value)` which also satisfies the interface.

### Margin tiers and warnings
- Engine produces `floor`, `target`, `ceiling` prices using configured margin %s.
- Three warnings emitted when relevant:
  - `PRICE_VS_FLOOR` — manual override below the floor margin
  - `JOB_HOURS` — unrealistic estimated hours
  - `PROFIT_MARGIN` — final price implies a margin below the floor

### VAT handling
- Three modes: `VAT_INCLUSIVE`, `VAT_EXCLUSIVE`, `NON_VAT`. All routed through the engine's vat handling block.

## Anti-Patterns to Never Use

- Adding DB queries inside the engine
- Using JS `number` arithmetic anywhere in `engine.ts`
- "Correcting" the formula to match the broken Excel cells (steps 1 and 16)
- Multiplying pct fields by 100 inside the engine
- Changing test expectations to make a "fix" pass — investigate why the test diverges instead
- Skipping `.toDecimalPlaces(2)` on final ₱ amounts

## Verification ritual

Before claiming any change works:
```bash
pnpm test --run
```
Must show **41/41 passing**. If the count changed, you either added tests (declare it explicitly) or broke parity (don't ship).

## When to call computePrice

- `QuoteBuilderForm` (client) — `useMemo` recompute on every form change, no server round-trip.
- `saveQuoteAction` (server) — re-compute server-side at save time to snapshot the result into `Quote.pricingSnapshot` (JSON).
- The snapshot stores the full `PricingResult` plus `rateSnapshot` and `inputsSnapshot` — never lose this.

## Hard gates (require human review)

Per `docs/CONSTRAINTS.md`:
- Any change to `src/features/pricing/engine.ts` is a hard gate. Surface a Build Brief first.
