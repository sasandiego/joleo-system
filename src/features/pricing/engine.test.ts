import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { computePrice } from "./engine";
import type { PricingInput, PricingContext } from "./types";

// Helper: wrap a plain number so it satisfies { toNumber(): number }
function dec(n: number) {
  return new Decimal(n);
}

// Default rate settings (mirrors prisma/seed.ts RATE_SETTINGS)
const DEFAULT_SETTINGS: PricingContext["settings"] = {
  dieselPricePerLiter:    dec(70),
  fuelSurchargePct:       dec(0.05),
  driverDailyRate:        dec(800),
  helperDailyRate:        dec(600),
  additionalHelperRate:   dec(600),
  additionalHourRate:     dec(350),
  additionalDropoffCharge:dec(300),
  condoHandlingFee:       dec(500),
  cateringHandlingFee:    dec(400),
  loadingUnloadingFee:    dec(0),
  nightDeliverySurcharge: dec(500),
  outOfTownSurcharge:     dec(500),
  longDistanceSurcharge:  dec(1500),
  distanceRatePerKm:      dec(12),
  maintenancePctOfBase:   dec(0.08),
  overheadPctOfDirect:    dec(0.10),
  contingencyPctOfDirect: dec(0.03),
  floorMarginPct:         dec(0.15),
  targetMarginPct:        dec(0.25),
  ceilingMarginPct:       dec(0.40),
  vatRate:                dec(0.12),
};

// V6 truck type — 14FT_6W (minBaseRate=4500, fuel=5km/L)
const V6: PricingContext["truckType"] = {
  minBaseRate:    dec(4500),
  fuelKmPerLiter: dec(5.0),
};

// 10FT_4W (minBaseRate=2500, fuel=7.5km/L)
const TEN_FT: PricingContext["truckType"] = {
  minBaseRate:    dec(2500),
  fuelKmPerLiter: dec(7.5),
};

// 20FT_6W (minBaseRate=8000, fuel=3.5km/L)
const TWENTY_FT: PricingContext["truckType"] = {
  minBaseRate:    dec(8000),
  fuelKmPerLiter: dec(3.5),
};

function base(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    estimatedDistanceKm: 60,
    estimatedJobHours: 8,
    includedHours: 8,
    numberOfHelpers: 1,
    numberOfDropoffs: 1,
    condoService: false,
    cateringService: false,
    nightDelivery: false,
    additionalHelper: false,
    outOfTown: false,
    longDistance: false,
    tollFee: 0,
    parkingFee: 0,
    discountAmount: 0,
    vatOption: "VAT_INCLUSIVE",
    ...overrides,
  };
}

// ─── Test Case 1: The Excel reference case (corrected) ────────────────────────
// V6, 100km, 2 dropoffs, 2 helpers, condo=yes, outOfTown=yes, VAT_INCLUSIVE
//
// The original Excel had broken cell refs for steps 1 & 16 (both showed 0).
// Our engine INCLUDES them. Correct direct cost = 12,300; target = ₱18,532.
//
// Step-by-step verification:
//   1. truckBase          = 4500
//   2. distanceCharge     = 100 × 12 = 1200
//   3. fuelCost           = (100/5) × 70 × 2 × 1.05 = 2940
//   4. driverCost         = 800
//   5. helperCost         = 600 × 2 = 1200
//   6. additionalHelper   = 0
//   7. excessHours        = 0 (8h = 8h included)
//   8. extraDropoffs      = (2-1) × 300 = 300
//   9. condoFee           = 500
//  10. cateringFee        = 0
//  11. loadUnload         = 0
//  12. nightSurcharge     = 0
//  13. outOfTownSurcharge = 500
//  14. longDistSurcharge  = 0
//  15. tollAndParking     = 0
//  16. maintenance        = 4500 × 0.08 = 360
//  directCostSubtotal     = 12,300
//  overhead               = 12300 × 0.10 = 1230
//  contingency            = 12300 × 0.03 = 369
//  totalCostBeforeProfit  = 13,899
//  targetPrice            = 13899 / 0.75 = 18,532 (exact)
//  finalPrice             = 18,532 (VAT_INCLUSIVE, no discount)
//  actualMargin           = (18532 - 13899) / 18532 = 0.25
describe("Test Case 1 — V6 Excel reference (corrected for broken cell refs)", () => {
  const result = computePrice(
    base({
      estimatedDistanceKm: 100,
      numberOfDropoffs: 2,
      numberOfHelpers: 2,
      condoService: true,
      outOfTown: true,
    }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("directCostSubtotal = 12,300", () => {
    expect(result.directCostSubtotal).toBe(12300);
  });

  it("overhead = 1,230", () => {
    expect(result.overheadAllocation).toBe(1230);
  });

  it("contingency = 369", () => {
    expect(result.contingencyBuffer).toBe(369);
  });

  it("totalCostBeforeProfit = 13,899", () => {
    expect(result.totalCostBeforeProfit).toBe(13899);
  });

  it("targetPrice = 18,532", () => {
    expect(result.targetPrice).toBe(18532);
  });

  it("finalPrice = 18,532 (VAT_INCLUSIVE, no discount)", () => {
    expect(result.finalPrice).toBe(18532);
  });

  it("actualMarginPct ≈ 0.25", () => {
    expect(result.actualMarginPct).toBeCloseTo(0.25, 4);
  });

  it("PRICE_VS_FLOOR is OK", () => {
    expect(result.warnings.find((w) => w.code === "PRICE_VS_FLOOR")?.level).toBe("OK");
  });

  it("PROFIT_MARGIN is OK", () => {
    expect(result.warnings.find((w) => w.code === "PROFIT_MARGIN")?.level).toBe("OK");
  });

  it("line items has 16 entries", () => {
    expect(result.lineItems).toHaveLength(16);
  });

  it("step 1 line item = 4500", () => {
    expect(result.lineItems.find((l) => l.code === "TRUCK_BASE_RATE")?.amount).toBe(4500);
  });

  it("step 16 line item (maintenance) = 360", () => {
    expect(result.lineItems.find((l) => l.code === "MAINTENANCE")?.amount).toBe(360);
  });
});

// ─── Test Case 2: Small local delivery (10FT_4W, 20km, 1 helper, VAT_EXCLUSIVE) ─
//   1. truckBase      = 2500
//   2. distanceCharge = 20 × 12 = 240
//   3. fuelCost       = (20/7.5) × 70 × 2 × 1.05 = 392 (exact: 8/3 × 147 = 392)
//   4. driverCost     = 800
//   5. helperCost     = 600
//  16. maintenance    = 2500 × 0.08 = 200
//  directCostSubtotal = 4732
//  totalCostBeforeProfit = 4732 × 1.13 = 5347.16
//  targetPrice = 5347.16 / 0.75 = 7129.55 (rounded)
//  VAT_EXCLUSIVE: vat = 7129.55 × 0.12; finalPrice = targetPrice + vat
describe("Test Case 2 — Small local job (10FT_4W, VAT_EXCLUSIVE)", () => {
  const result = computePrice(
    base({
      estimatedDistanceKm: 20,
      vatOption: "VAT_EXCLUSIVE",
    }),
    { truckType: TEN_FT, settings: DEFAULT_SETTINGS }
  );

  it("directCostSubtotal = 4,732", () => {
    expect(result.directCostSubtotal).toBe(4732);
  });

  it("totalCostBeforeProfit = 5,347.16", () => {
    expect(result.totalCostBeforeProfit).toBe(5347.16);
  });

  it("targetPrice ≈ 7,129.55", () => {
    expect(result.targetPrice).toBeCloseTo(7129.55, 1);
  });

  it("finalPrice > targetPrice (VAT added on top)", () => {
    expect(result.finalPrice).toBeGreaterThan(result.targetPrice);
  });

  it("vatAmount ≈ targetPrice × 0.12", () => {
    expect(result.vatAmount).toBeCloseTo(result.targetPrice * 0.12, 1);
  });

  it("PRICE_VS_FLOOR is OK", () => {
    expect(result.warnings.find((w) => w.code === "PRICE_VS_FLOOR")?.level).toBe("OK");
  });

  it("PROFIT_MARGIN is OK", () => {
    expect(result.warnings.find((w) => w.code === "PROFIT_MARGIN")?.level).toBe("OK");
  });
});

// ─── Test Case 3: Long-distance to Baguio (20FT_6W, 350km) ──────────────────
//   1. truckBase           = 8000
//   2. distanceCharge      = 350 × 12 = 4200
//   3. fuelCost            = (350/3.5) × 70 × 2 × 1.05 = 100 × 147 = 14700
//   4. driverCost          = 800
//   5. helperCost          = 600 × 2 = 1200
//  13. outOfTownSurcharge  = 500
//  14. longDistSurcharge   = 1500
//  16. maintenance         = 8000 × 0.08 = 640
//  directCostSubtotal      = 31,540
//  totalCostBeforeProfit   = 31540 × 1.13 = 35,640.20
//  targetPrice             = 35640.20 / 0.75 = 47,520.27 (rounded)
describe("Test Case 3 — Long-distance to Baguio (20FT_6W, 350km)", () => {
  const result = computePrice(
    base({
      estimatedDistanceKm: 350,
      numberOfHelpers: 2,
      outOfTown: true,
      longDistance: true,
    }),
    { truckType: TWENTY_FT, settings: DEFAULT_SETTINGS }
  );

  it("directCostSubtotal = 31,540", () => {
    expect(result.directCostSubtotal).toBe(31540);
  });

  it("totalCostBeforeProfit = 35,640.20", () => {
    expect(result.totalCostBeforeProfit).toBe(35640.20);
  });

  it("targetPrice ≈ 47,520.27", () => {
    expect(result.targetPrice).toBeCloseTo(47520.27, 1);
  });

  it("longDistSurcharge line item = 1,500", () => {
    expect(result.lineItems.find((l) => l.code === "LONG_DIST_SURCHARGE")?.amount).toBe(1500);
  });

  it("outOfTownSurcharge line item = 500", () => {
    expect(result.lineItems.find((l) => l.code === "OUT_OF_TOWN_SURCHARGE")?.amount).toBe(500);
  });

  it("actualMarginPct ≈ 0.25", () => {
    expect(result.actualMarginPct).toBeCloseTo(0.25, 3);
  });
});

// ─── Test Case 4: Discount applied (V6, 50km, VAT_INCLUSIVE, discount=1000) ──
//   directCostSubtotal = 8,330
//   totalCostBeforeProfit = 9,412.90
//   targetPrice = 9412.90 / 0.75 = 12,550.53
//   priceAfterDiscount = 12,550.53 - 1,000 = 11,550.53
//   finalPrice = 11,550.53 (VAT_INCLUSIVE)
//   floorPrice = 9412.90 / 0.85 = 11,074 → 11,550.53 > 11,074 → OK
describe("Test Case 4 — Discount applied (VAT_INCLUSIVE, ₱1,000 discount)", () => {
  const result = computePrice(
    base({
      estimatedDistanceKm: 50,
      discountAmount: 1000,
    }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("directCostSubtotal = 8,330", () => {
    expect(result.directCostSubtotal).toBe(8330);
  });

  it("totalCostBeforeProfit = 9,412.90", () => {
    expect(result.totalCostBeforeProfit).toBe(9412.90);
  });

  it("discountAmount = 1,000", () => {
    expect(result.discountAmount).toBe(1000);
  });

  it("finalPrice = priceAfterDiscount (VAT_INCLUSIVE)", () => {
    expect(result.finalPrice).toBe(result.priceAfterDiscount);
  });

  it("finalPrice ≈ 11,550.53", () => {
    expect(result.finalPrice).toBeCloseTo(11550.53, 1);
  });

  it("PRICE_VS_FLOOR is OK (above floor even after discount)", () => {
    expect(result.warnings.find((w) => w.code === "PRICE_VS_FLOOR")?.level).toBe("OK");
  });
});

// ─── Test Case 5: Floor margin violation ─────────────────────────────────────
// Same as TC4 inputs but discount=2000 → finalPrice falls below floorPrice
//   targetPrice ≈ 12,550.53
//   finalPrice ≈ 10,550.53 (after ₱2,000 discount)
//   floorPrice  = 9412.90 / 0.85 = 11,074 → 10,550.53 < 11,074 → ERROR
//   actualMargin < 15% (floor) → PROFIT_MARGIN ERROR
describe("Test Case 5 — Floor margin violation (₱2,000 discount triggers ERROR)", () => {
  const result = computePrice(
    base({
      estimatedDistanceKm: 50,
      discountAmount: 2000,
    }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("finalPrice < floorPrice", () => {
    expect(result.finalPrice).toBeLessThan(result.floorPrice);
  });

  it("PRICE_VS_FLOOR is ERROR", () => {
    expect(result.warnings.find((w) => w.code === "PRICE_VS_FLOOR")?.level).toBe("ERROR");
  });

  it("PROFIT_MARGIN is ERROR (actualMargin < floorMarginPct)", () => {
    expect(result.warnings.find((w) => w.code === "PROFIT_MARGIN")?.level).toBe("ERROR");
  });

  it("actualMarginPct < 0.15", () => {
    expect(result.actualMarginPct).toBeLessThan(0.15);
  });
});

// ─── Test Case 6: Overtime — job hours > included hours ──────────────────────
// V6, 60km, 10 job hours, 8 included → 2 excess hours × ₱350 = ₱700
describe("Test Case 6 — Overtime (10 job hours, 8 included)", () => {
  const result = computePrice(
    base({
      estimatedJobHours: 10,
      includedHours: 8,
    }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("excess hours charge line item = 700", () => {
    expect(result.lineItems.find((l) => l.code === "EXCESS_HOURS")?.amount).toBe(700);
  });

  it("JOB_HOURS warning is WARNING", () => {
    expect(result.warnings.find((w) => w.code === "JOB_HOURS")?.level).toBe("WARNING");
  });
});

// ─── Test Case 7: NON_VAT option — vat = 0, finalPrice = priceAfterDiscount ──
describe("Test Case 7 — NON_VAT", () => {
  const result = computePrice(
    base({ vatOption: "NON_VAT" }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("vatAmount = 0", () => {
    expect(result.vatAmount).toBe(0);
  });

  it("finalPrice = priceAfterDiscount", () => {
    expect(result.finalPrice).toBe(result.priceAfterDiscount);
  });
});

// ─── Test Case 8: Fuel price override ────────────────────────────────────────
// Using fuelPriceOverride=80 instead of default 70 — fuel cost should be higher
describe("Test Case 8 — Fuel price override (₱80 vs default ₱70)", () => {
  const withOverride = computePrice(
    base({ fuelPriceOverride: 80 }),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );
  const noOverride = computePrice(
    base(),
    { truckType: V6, settings: DEFAULT_SETTINGS }
  );

  it("fuel cost is higher with override", () => {
    const fuelOverride = withOverride.lineItems.find((l) => l.code === "FUEL_COST")!.amount;
    const fuelDefault = noOverride.lineItems.find((l) => l.code === "FUEL_COST")!.amount;
    expect(fuelOverride).toBeGreaterThan(fuelDefault);
  });

  it("finalPrice is higher with override", () => {
    expect(withOverride.finalPrice).toBeGreaterThan(noOverride.finalPrice);
  });
});
