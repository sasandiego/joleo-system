# Joleo Transport — Pricing Engine Refactor & Admin Config UI

## Context

We are refactoring the pricing matrix, quotation system, and admin pricing configuration UI for the Joleo Transport admin portal based on user evaluation feedback. This is a live prototype with NO existing bookings — safe to refactor freely without data migration concerns.

## Scope

Implement 7 fixes to the pricing engine and quotation system, PLUS build an admin pricing configuration UI where rates and thresholds can be edited.

---

## SECTION A — FIX LIST (Implement in Order)

Implement fixes in this order. After each fix, stop and confirm before proceeding.

### FIX-001 — Driver & Helper Rates

- Driver rate: 15 percent of Revenue Net of VAT
- Helper rate: 7.5 percent of Revenue Net of VAT
- These are markups added to base cost (bottom-up pricing), not deductions
- Store in pricing config — do not hardcode

### FIX-002 — Trip Billing Type Toggle

- Add new field `trip_billing_type` to bookings and quotes
- Enum values: `8_HOUR` and `PER_TRIP`
- Add dropdown or toggle in booking UI labeled:
  - "8 Hours" for local and short trips
  - "Per Trip" for long-distance trips
- Pricing engine branches on this:
  - If `8_HOUR`, use hourly rate times 8
  - If `PER_TRIP`, use per-trip flat rate
- Both rates configurable in admin pricing config

### FIX-003 — Fuel Cost Formula

Replace existing fuel calculation with this formula:

```
fuel_cost = MAX(500, distance_km * 2 / 5 * fuel_price_per_liter)
```

Where:
- 500 is the minimum fuel floor in pesos (configurable)
- 2 is the round-trip multiplier
- 5 is the kilometers per liter efficiency (configurable)
- `fuel_price_per_liter` is the current diesel price (configurable)

Logic: If computed fuel is less than 500, use 500. Otherwise use computed value.

### FIX-004 — Overhead Rate

- Overhead rate: 5 percent of Revenue Net of VAT
- Same treatment as driver and helper rates — it is a markup added to base
- Store in pricing config

### FIX-005 — Remove Night Surcharge

Hard delete night surcharge from:
- Database schema (drop column or remove field)
- Pricing engine (delete calculation)
- Admin UI (remove input field)
- Quotation display (remove line item)

No feature flag, no soft delete — fully remove.

### FIX-006 — Consolidate Distance Surcharges

- Remove both existing surcharges: `out_of_town_surcharge` and `long_distance_surcharge`
- Replace with single field: `long_distance_surcharge`
- Rate: 5 percent of Revenue Net of VAT
- Trigger: when `distance_km` is greater than or equal to 50
- Both rate and threshold configurable in admin pricing config

### FIX-007 — Make Quotation Fully Editable

- Currently quotation fields are read-only — this is a bug
- Make all fields editable by admin role:
  - Pricing and rates (override capability)
  - Customer info
  - Trip details (origin, destination, date)
  - Line items
- Add audit trail: log who edited what and when
- Admin overrides should NOT change global pricing config — only this specific quote

---

## SECTION B — CORE PRICING FORMULA

This is bottom-up pricing. Markups are added to base cost to derive Revenue Net of VAT.

### Mathematical Formula

```
Base Costs           = fuel_cost + trip_base_rate + other_direct_costs

Markup Total         = 0.15 (driver) + 0.075 (helper) + 0.05 (overhead)
                     + 0.05 (long_distance, IF distance_km >= 50)

Revenue Net of VAT   = Base Costs / (1 - Markup Total)
VAT                  = Revenue Net of VAT * 0.12
Final Quote          = Revenue Net of VAT * 1.12
```

### Why Division Instead of Multiplication

We cannot just compute `base * markup` because the markup is a percent of revenue, not a percent of base. Solving the circular equation:

```
R = B + (R * markup)
R - (R * markup) = B
R * (1 - markup) = B
R = B / (1 - markup)
```

### Allocation Breakdown (For Reporting)

After computing Revenue Net of VAT, derive these allocations:

```
driver_allocation        = Revenue Net of VAT * 0.15
helper_allocation        = Revenue Net of VAT * 0.075
overhead_allocation      = Revenue Net of VAT * 0.05
long_distance_allocation = Revenue Net of VAT * 0.05 (only if distance >= 50km)
```

### Worked Example

Trip parameters: 30 km, fuel 70 pesos per liter, 8-hour billing at 3,000 peso base rate.

| Step | Computation | Result |
|------|-------------|--------|
| Fuel | MAX(500, 30 * 2/5 * 70) | 840 |
| Base Costs | 840 + 3000 | 3,840 |
| Markup Total | 0.15 + 0.075 + 0.05 (no long-distance) | 0.275 |
| Revenue Net of VAT | 3840 / (1 - 0.275) | 5,296.55 |
| VAT | 5296.55 * 0.12 | 635.59 |
| Final Quote | 5296.55 * 1.12 | 5,931.34 |

This example MUST produce 5,931.34 exactly. Use it as a validation checkpoint.

---

## SECTION C — TECHNICAL REQUIREMENTS

### Data Types

- Use Decimal (or equivalent precise numeric type) for ALL currency math
- NEVER use float — causes rounding errors in financial calculations
- Round to 2 decimal places only at the display or storage step

### Pricing Config Schema

Create a centralized, editable pricing config with these fields:

| Field | Default Value | Editable in Admin UI |
|-------|---------------|----------------------|
| driver_rate | 0.15 | Yes |
| helper_rate | 0.075 | Yes |
| overhead_rate | 0.05 | Yes |
| long_distance_rate | 0.05 | Yes |
| long_distance_threshold_km | 50 | Yes |
| fuel_floor | 500 | Yes |
| fuel_floor_km | 15 | Yes |
| fuel_efficiency_kmpl | 5 | Yes |
| fuel_price_per_liter | current diesel price | Yes |
| vat_rate | 0.12 | No (regulated) |
| hourly_rate_8hr | TBD | Yes |
| per_trip_base_rate | TBD | Yes |

### Output / Quote Breakdown Schema

Every quote must return a transparent breakdown containing:
- Fuel cost
- Trip base
- Other direct costs
- Base total
- Revenue Net of VAT
- Driver allocation
- Helper allocation
- Overhead allocation
- Long-distance allocation (if applicable)
- VAT amount
- Final quote
- Markup rate applied

### Validation Rules

- `markup_total` must be less than 1.0 (less than 100 percent) — otherwise division fails
- `distance_km` must be greater than 0
- `fuel_price_per_liter` must be greater than 0
- Fail loudly with descriptive errors — do not silently default

---

## SECTION D — ADMIN PRICING CONFIG UI

Build an admin-only screen where rates and thresholds can be edited.

### Page Layout

The page should have 4 main sections, each as a separate card or panel:

#### 1. Labor Markups Section

Fields:
- Driver Rate (percent input, default 15)
- Helper Rate (percent input, default 7.5)

Display helper text: "Percentage of Revenue Net of VAT allocated to driver and helper compensation."

#### 2. Overhead and Surcharges Section

Fields:
- Overhead Rate (percent input, default 5)
- Long-Distance Surcharge Rate (percent input, default 5)
- Long-Distance Threshold (kilometers input, default 50)

Display helper text: "Long-distance surcharge applies when trip distance equals or exceeds the threshold."

#### 3. Fuel Configuration Section

Fields:
- Fuel Floor (peso input, default 500)
- Fuel Floor Distance (km input, default 15)
- Fuel Efficiency (km per liter input, default 5)
- Current Fuel Price (peso per liter input, manually updated)

Display helper text: "Fuel cost uses MAX(floor, distance * 2 / efficiency * price). Update fuel price when diesel rate changes."

#### 4. Trip Base Rates Section

Fields:
- 8-Hour Base Rate (peso input)
- Per-Trip Base Rate (peso input)

Display helper text: "Base rate before markups and fuel are applied."

### UI Behavior Requirements

- All fields editable inline
- Save button at the bottom (disabled until changes are made)
- Show "Last updated by [user] on [timestamp]" for audit trail
- Confirmation modal before saving: "This will affect all future quotes. Continue?"
- Show a live preview panel on the right side:
  - Sample trip: 30km, current fuel price, 8-hour billing
  - Show computed Revenue Net of VAT and Final Quote
  - Updates in real-time as admin edits values
- Validation:
  - Sum of all markup rates must be less than 100 percent
  - All numeric fields must be greater than 0
  - VAT field is read-only and locked at 12 percent
- Reset to Defaults button (with confirmation)
- Access control: only users with admin role can view or edit this page

### Audit Trail Requirements

- Log every change with: user ID, timestamp, field name, old value, new value
- Display last 10 changes in a collapsible section on the same page
- Store full history in database for compliance

---

## SECTION E — TESTING REQUIREMENTS

Write unit tests covering these scenarios:

1. Short trip (less than 15 km) — fuel floor kicks in
2. Medium trip (15 to 49 km) — computed fuel, no long-distance surcharge
3. Long trip (50 km or more) — computed fuel plus long-distance surcharge applied
4. 8-hour billing type — produces valid quote
5. Per-trip billing type — produces valid quote
6. Edge case: distance_km equals 0 — should error
7. Edge case: markup_total equals or exceeds 1.0 — should error
8. Edge case: fuel_price equals 0 — should error
9. Allocation math: sum of (base + all allocations) equals Revenue Net of VAT
10. VAT calculation: Final Quote equals Revenue Net of VAT times 1.12
11. Worked example validation: 30km, 70 peso fuel, 3000 base, 8-hour → produces 5,931.34

---

## SECTION F — SUGGESTED FILE STRUCTURE

```
src/
  pricing/
    config.py              PricingConfig dataclass
    engine.py              calculate_quote main function
    fuel.py                fuel cost logic
    allocations.py         markup allocation breakdown
    types.py               QuoteInput, QuoteBreakdown, enums
  admin/
    pricing_config_ui.py   admin pricing config screen
    quotation_editor.py    FIX-007 editable quote UI
    audit_log.py           audit trail logging
  tests/
    pricing/
      test_engine.py
      test_fuel.py
      test_edge_cases.py
      test_worked_example.py
    admin/
      test_pricing_config_ui.py
```

---

## SECTION G — WHAT NOT TO DO

- Do not hardcode rates — always read from config
- Do not use float for money — use Decimal
- Do not add markups as `base * rate` — that is wrong math, use the division formula
- Do not keep night surcharge code "just in case" — remove it fully
- Do not migrate old surcharge data — there is no existing data
- Do not let admin override change global config when editing a single quote
- Do not allow VAT rate to be edited in the UI (regulated value)
- Do not skip the audit trail — required for compliance

---

## SECTION H — ACCEPTANCE CRITERIA

Before marking complete, verify all of the following:

- All 7 fixes implemented and tested
- Worked example produces 5,931.34 exactly
- Night surcharge fully removed from codebase (search for "night" returns no surcharge code)
- Both old distance surcharges removed, replaced with single long_distance_surcharge
- 50 km threshold triggers long-distance surcharge correctly
- 8-hour vs Per-trip toggle visible and functional in booking UI
- Fuel floor of 500 enforced for trips less than 15 km
- Quotation fields all editable by admin
- Quote breakdown shows all line items transparently
- All unit tests pass
- Admin pricing config UI fully functional
- Audit trail captures all config changes
- Live preview panel in admin UI updates in real-time

---

## SECTION I — IMPLEMENTATION APPROACH

Recommended sequence:

1. Start with pricing engine core: config.py, engine.py, fuel.py, types.py
2. Write unit tests immediately — verify worked example first
3. Update database schema: add trip_billing_type, remove night surcharge, consolidate distance surcharges
4. Build admin pricing config UI with live preview
5. Implement audit trail and logging
6. Update booking and quotation UI: add billing type toggle, make quotation editable
7. End-to-end test: create a quote, verify breakdown matches expectations
8. Confirm with user before deploying

---

## SECTION J — IF YOU HIT AMBIGUITY

Ask before guessing. Specifically flag:
- Any place where current code structure makes the refactor harder than expected
- Any business logic that seems to contradict the formulas above
- Any UI or UX decisions not specified here
- Any existing code that may conflict with these changes

---

## END OF GUIDE

Start by reading the existing codebase to understand current structure, then present a plan before writing any code.
