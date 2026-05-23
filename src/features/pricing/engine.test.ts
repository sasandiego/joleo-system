import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { computePrice } from "./engine";
import { PricingValidationError, type PricingInput } from "./types";

function buildSettings(overrides: Partial<Record<string, number>> = {}) {
  const defaults = {
    driverRate: 0.15,
    helperRate: 0.075,
    overheadRate: 0.05,
    longDistanceRate: 0.05,
    longDistanceThresholdKm: 50,
    fuelFloor: 500,
    fuelEfficiencyKmpl: 5,
    dieselPricePerLiter: 70,
    distanceRatePerKm: 12,
    additionalHourRate: 350,
    additionalHelperRate: 600,
    additionalDropoffCharge: 300,
    standardIncludedHours: 8,
    condoHandlingFee: 500,
    cateringHandlingFee: 400,
    loadingUnloadingFee: 0,
    vatRate: 0.12,
  };
  const merged = { ...defaults, ...overrides };
  return {
    driverRate: new Decimal(merged.driverRate),
    helperRate: new Decimal(merged.helperRate),
    overheadRate: new Decimal(merged.overheadRate),
    longDistanceRate: new Decimal(merged.longDistanceRate),
    longDistanceThresholdKm: merged.longDistanceThresholdKm,
    fuelFloor: new Decimal(merged.fuelFloor),
    fuelEfficiencyKmpl: new Decimal(merged.fuelEfficiencyKmpl),
    dieselPricePerLiter: new Decimal(merged.dieselPricePerLiter),
    distanceRatePerKm: new Decimal(merged.distanceRatePerKm),
    additionalHourRate: new Decimal(merged.additionalHourRate),
    additionalHelperRate: new Decimal(merged.additionalHelperRate),
    additionalDropoffCharge: new Decimal(merged.additionalDropoffCharge),
    standardIncludedHours: merged.standardIncludedHours,
    condoHandlingFee: new Decimal(merged.condoHandlingFee),
    cateringHandlingFee: new Decimal(merged.cateringHandlingFee),
    loadingUnloadingFee: new Decimal(merged.loadingUnloadingFee),
    vatRate: new Decimal(merged.vatRate),
  };
}

function buildTruckType(eightHr: number, perTrip: number) {
  return {
    eightHourBaseRate: new Decimal(eightHr),
    perTripBaseRate: new Decimal(perTrip),
  };
}

function buildInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    estimatedDistanceKm: 30,
    estimatedJobHours: 8,
    tripBillingType: "EIGHT_HOUR",
    numberOfDropoffs: 1,
    condoService: false,
    cateringService: false,
    additionalHelper: false,
    tollFee: 0,
    discountAmount: 0,
    vatOption: "VAT_EXCLUSIVE",
    ...overrides,
  };
}

// Worked example: 30km, ₱70/L, ₱3,000 base, EIGHT_HOUR, VAT_EXCLUSIVE, no distance charge
// Corrected from guide's ₱5,931.34 to actual ₱5,932.14.
describe("Pricing engine — worked example (Joleo_Update_Guide SECTION B, corrected)", () => {
  it("produces ₱5,932.14 for 30km / ₱70/L / ₱3,000 base / 8-hour billing", () => {
    const result = computePrice(
      buildInput({ estimatedDistanceKm: 30, vatOption: "VAT_EXCLUSIVE" }),
      {
        truckType: buildTruckType(3000, 4200),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );

    expect(result.fuelCost).toBe(840);
    expect(result.tripBase).toBe(3000);
    expect(result.baseCosts).toBe(3840);
    expect(result.markupRate).toBe(0.275);
    expect(result.revenueNetOfVat).toBe(5296.55);
    expect(result.vatAmount).toBe(635.59);
    expect(result.finalPrice).toBe(5932.14);
  });
});

describe("Pricing engine — fuel floor", () => {
  it("applies fuel floor when computed fuel is below floor (5 km)", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 5 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.fuelCost).toBe(500);
    expect(result.warnings.some((w) => w.code === "FUEL_FLOOR_APPLIED")).toBe(true);
  });

  it("uses computed fuel for medium trips (30 km)", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 30 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.fuelCost).toBe(840);
    expect(result.warnings.some((w) => w.code === "FUEL_FLOOR_APPLIED")).toBe(false);
  });

  it("scales fuel cost with distance for long trips (200 km)", () => {
    const result = computePrice(
      buildInput({ estimatedDistanceKm: 200, tripBillingType: "PER_TRIP" }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.fuelCost).toBe(5600);
  });
});

describe("Pricing engine — long-distance surcharge", () => {
  it("does NOT trigger at 49 km", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 49 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.isLongDistance).toBe(false);
    expect(result.markupRate).toBe(0.275);
    expect(result.allocations.longDistance).toBe(0);
  });

  it("triggers exactly at the 50 km threshold", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 50 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.isLongDistance).toBe(true);
    expect(result.markupRate).toBe(0.325);
    expect(result.allocations.longDistance).toBeGreaterThan(0);
  });

  it("respects a custom threshold (100 km)", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 75 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0, longDistanceThresholdKm: 100 }),
    });
    expect(result.isLongDistance).toBe(false);
  });
});

describe("Pricing engine — billing type", () => {
  it("EIGHT_HOUR uses eight-hour base rate", () => {
    const result = computePrice(
      buildInput({ tripBillingType: "EIGHT_HOUR", estimatedDistanceKm: 20 }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.tripBase).toBe(3000);
  });

  it("PER_TRIP uses per-trip base rate", () => {
    const result = computePrice(
      buildInput({ tripBillingType: "PER_TRIP", estimatedDistanceKm: 100 }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.tripBase).toBe(5000);
  });

  it("PER_TRIP ignores excess hours", () => {
    const result = computePrice(
      buildInput({ tripBillingType: "PER_TRIP", estimatedJobHours: 14 }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.otherDirectCosts.excessHoursFee).toBe(0);
  });

  it("EIGHT_HOUR computes excess-hour fee beyond standard", () => {
    const result = computePrice(
      buildInput({ tripBillingType: "EIGHT_HOUR", estimatedJobHours: 11 }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.otherDirectCosts.excessHoursFee).toBe(1050);
  });
});

describe("Pricing engine — validation errors", () => {
  it("throws when distance is 0", () => {
    expect(() =>
      computePrice(buildInput({ estimatedDistanceKm: 0 }), {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings(),
      }),
    ).toThrow(PricingValidationError);
  });

  it("throws when fuel price is 0", () => {
    expect(() =>
      computePrice(buildInput(), {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ dieselPricePerLiter: 0 }),
      }),
    ).toThrow(PricingValidationError);
  });

  it("throws when markup total reaches 100%", () => {
    expect(() =>
      computePrice(buildInput(), {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ driverRate: 0.5, helperRate: 0.3, overheadRate: 0.25 }),
      }),
    ).toThrow(PricingValidationError);
  });
});

describe("Pricing engine — allocation math", () => {
  it("sum of (base + all allocations) equals revenue net of VAT (no long-distance)", () => {
    const result = computePrice(buildInput({ estimatedDistanceKm: 30 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    const sum =
      result.baseCosts +
      result.allocations.driver +
      result.allocations.helper +
      result.allocations.overhead +
      result.allocations.longDistance;
    expect(Math.abs(sum - result.revenueNetOfVat)).toBeLessThan(0.05);
  });

  it("sum of (base + all allocations) equals revenue net of VAT (long-distance applied)", () => {
    const result = computePrice(
      buildInput({ estimatedDistanceKm: 100, tripBillingType: "PER_TRIP" }),
      {
        truckType: buildTruckType(3000, 5000),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    expect(result.isLongDistance).toBe(true);
    const sum =
      result.baseCosts +
      result.allocations.driver +
      result.allocations.helper +
      result.allocations.overhead +
      result.allocations.longDistance;
    expect(Math.abs(sum - result.revenueNetOfVat)).toBeLessThan(0.05);
  });
});

describe("Pricing engine — VAT modes", () => {
  it("VAT_EXCLUSIVE: final = revenue × 1.12", () => {
    const result = computePrice(buildInput({ vatOption: "VAT_EXCLUSIVE" }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.vatAmount).toBeGreaterThan(0);
    expect(result.finalPrice).toBe(5932.14);
  });

  it("VAT_INCLUSIVE: same total as VAT_EXCLUSIVE", () => {
    const result = computePrice(buildInput({ vatOption: "VAT_INCLUSIVE" }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.finalPrice).toBe(5932.14);
  });

  it("NON_VAT: no VAT added", () => {
    const result = computePrice(buildInput({ vatOption: "NON_VAT" }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.vatAmount).toBe(0);
    expect(result.finalPrice).toBe(result.revenueAfterDiscount);
  });
});

describe("Pricing engine — toll in base costs", () => {
  it("toll is marked up and VAT'd along with other base costs", () => {
    const baseline = computePrice(buildInput({ tollFee: 0 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    const withToll = computePrice(buildInput({ tollFee: 500 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    // toll goes into baseCosts → marked up: 500 / (1 - 0.275) = 689.66 → × 1.12 = 772.41
    expect(withToll.finalPrice - baseline.finalPrice).toBeCloseTo(772.41, 1);
    // VAT increases by 689.66 × 0.12 ≈ 82.76
    expect(withToll.vatAmount - baseline.vatAmount).toBeCloseTo(82.76, 1);
  });
});

describe("Pricing engine — discount", () => {
  it("discount reduces revenue before VAT", () => {
    const result = computePrice(buildInput({ discountAmount: 500 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.revenueAfterDiscount).toBe(4796.55);
    expect(result.warnings.some((w) => w.code === "DISCOUNT_APPLIED")).toBe(true);
  });
});

describe("Pricing engine — manual override", () => {
  it("override becomes the final price; computed price preserved", () => {
    const result = computePrice(buildInput({ manualOverridePrice: 5500 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.finalPrice).toBe(5500);
    expect(result.computedFinalPrice).toBe(5932.14);
    expect(result.manualOverridePrice).toBe(5500);
    expect(result.warnings.some((w) => w.code === "OVERRIDE_APPLIED")).toBe(true);
  });

  it("override back-computes VAT from gross", () => {
    const result = computePrice(buildInput({ manualOverridePrice: 5600 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.effectiveRevenueNetOfVat).toBe(5000);
    expect(result.effectiveVatAmount).toBe(600);
  });

  it("override + toll back-computes VAT simply (toll already inside revenue)", () => {
    const result = computePrice(
      buildInput({ manualOverridePrice: 6000, tollFee: 400 }),
      {
        truckType: buildTruckType(3000, 4200),
        settings: buildSettings({ distanceRatePerKm: 0 }),
      },
    );
    // toll is in baseCosts → override / 1.12 = revenue (toll contribution already inside)
    expect(result.effectiveRevenueNetOfVat).toBe(5357.14);
    expect(result.effectiveVatAmount).toBe(642.86);
  });
});

describe("Pricing engine — service flag fees", () => {
  it("condo flag adds condo handling fee", () => {
    const result = computePrice(buildInput({ condoService: true }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.otherDirectCosts.condoFee).toBe(500);
  });

  it("catering flag adds catering fee", () => {
    const result = computePrice(buildInput({ cateringService: true }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.otherDirectCosts.cateringFee).toBe(400);
  });

  it("additional helper flag adds helper fee", () => {
    const result = computePrice(buildInput({ additionalHelper: true }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.otherDirectCosts.additionalHelperFee).toBe(600);
  });

  it("extra drop-offs charge each beyond the first", () => {
    const result = computePrice(buildInput({ numberOfDropoffs: 3 }), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ distanceRatePerKm: 0 }),
    });
    expect(result.otherDirectCosts.extraDropoffsFee).toBe(600);
  });
});

describe("Pricing engine — snapshot integrity", () => {
  it("ratesSnapshot preserves the config at compute time", () => {
    const result = computePrice(buildInput(), {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings({ driverRate: 0.18 }),
    });
    expect(result.ratesSnapshot.driverRate).toBe(0.18);
  });

  it("inputsSnapshot preserves the input shape", () => {
    const input = buildInput({ estimatedDistanceKm: 42, tripBillingType: "PER_TRIP" });
    const result = computePrice(input, {
      truckType: buildTruckType(3000, 4200),
      settings: buildSettings(),
    });
    expect(result.inputsSnapshot.estimatedDistanceKm).toBe(42);
    expect(result.inputsSnapshot.tripBillingType).toBe("PER_TRIP");
  });
});
