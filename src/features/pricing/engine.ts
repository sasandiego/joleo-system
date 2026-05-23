import Decimal from "decimal.js";
import {
  type PricingInput,
  type PricingContext,
  type PricingResult,
  type Allocations,
  type OtherDirectCosts,
  type PricingWarning,
  PricingValidationError,
} from "./types";

// Set 28-digit precision (well beyond DECIMAL(12,2) storage) with half-up rounding.
// Rounding to 2 dp happens only at output / storage time.
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

function d(v: number): Decimal {
  return new Decimal(v);
}

function dp2(v: Decimal): number {
  return v.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function pct4(v: Decimal): number {
  return v.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Compute a quote price using the bottom-up revenue model.
 *
 * Formula (per Joleo_Update_Guide.md SECTION B):
 *   fuel_cost          = MAX(fuelFloor, distance × 2 / efficiency × diesel_price)
 *   base_costs         = fuel + trip_base + distance_charge + other_direct_costs + toll
 *   markup_total       = driverRate + helperRate + overheadRate
 *                        + (longDistanceRate IF distance ≥ threshold)
 *   revenue_net_of_vat = base_costs / (1 - markup_total)
 *   vat                = revenue_net_of_vat × vatRate  (unless NON_VAT)
 *   final              = revenue_net_of_vat + vat
 *
 * Toll is included in base costs — same markup and VAT treatment as all other costs.
 * `manualOverridePrice` (when set) becomes the final price; VAT is back-computed from
 * the override for BIR-compliant receipts.
 */
export function computePrice(input: PricingInput, ctx: PricingContext): PricingResult {
  const { truckType, settings } = ctx;
  const warnings: PricingWarning[] = [];

  // ── Validation (fail loudly per guide SECTION C) ─────────────────────────
  if (input.estimatedDistanceKm <= 0) {
    throw new PricingValidationError("Distance must be greater than 0 km.");
  }

  // Pull all rates into Decimal
  const driverRate = d(settings.driverRate.toNumber());
  const helperRate = d(settings.helperRate.toNumber());
  const overheadRate = d(settings.overheadRate.toNumber());
  const longDistanceRate = d(settings.longDistanceRate.toNumber());
  const longDistanceThresholdKm = settings.longDistanceThresholdKm;
  const fuelFloor = d(settings.fuelFloor.toNumber());
  const fuelEfficiencyKmpl = d(settings.fuelEfficiencyKmpl.toNumber());
  const distanceRatePerKm = d(settings.distanceRatePerKm.toNumber());
  const additionalHourRate = d(settings.additionalHourRate.toNumber());
  const additionalHelperRate = d(settings.additionalHelperRate.toNumber());
  const additionalDropoffCharge = d(settings.additionalDropoffCharge.toNumber());
  const standardIncludedHours = settings.standardIncludedHours;
  const condoHandlingFee = d(settings.condoHandlingFee.toNumber());
  const cateringHandlingFee = d(settings.cateringHandlingFee.toNumber());
  const loadingUnloadingFee = d(settings.loadingUnloadingFee.toNumber());
  const vatRate = d(settings.vatRate.toNumber());
  const eightHourBaseRate = d(truckType.eightHourBaseRate.toNumber());
  const perTripBaseRate = d(truckType.perTripBaseRate.toNumber());

  const effectiveDieselPrice =
    input.fuelPriceOverride !== undefined && input.fuelPriceOverride > 0
      ? d(input.fuelPriceOverride)
      : d(settings.dieselPricePerLiter.toNumber());

  if (effectiveDieselPrice.lte(0)) {
    throw new PricingValidationError("Fuel price must be greater than 0.");
  }
  if (fuelEfficiencyKmpl.lte(0)) {
    throw new PricingValidationError("Fuel efficiency (km/L) must be greater than 0.");
  }

  // ── Trip base (per billing type + truck type) ────────────────────────────
  const tripBase = input.tripBillingType === "EIGHT_HOUR" ? eightHourBaseRate : perTripBaseRate;

  // ── Fuel cost: MAX(floor, distance × 2 / efficiency × price) ─────────────
  const computedFuel = d(input.estimatedDistanceKm)
    .mul(2)
    .div(fuelEfficiencyKmpl)
    .mul(effectiveDieselPrice);
  const fuelCost = Decimal.max(fuelFloor, computedFuel);
  if (fuelCost.gt(computedFuel)) {
    warnings.push({
      code: "FUEL_FLOOR_APPLIED",
      level: "INFO",
      message: `Fuel floor ₱${dp2(fuelFloor).toLocaleString("en-PH")} applied (computed fuel was ₱${dp2(computedFuel).toLocaleString("en-PH")}).`,
    });
  }

  // ── Distance charge (per-km service rate; separate from fuel) ────────────
  const distanceCharge = d(input.estimatedDistanceKm).mul(distanceRatePerKm);

  // ── Other direct costs ───────────────────────────────────────────────────
  const condoFee = input.condoService ? condoHandlingFee : d(0);
  const cateringFee = input.cateringService ? cateringHandlingFee : d(0);
  const loadingFee = loadingUnloadingFee; // always applied if rate > 0
  const additionalHelperFee = input.additionalHelper ? additionalHelperRate : d(0);

  // Excess hours only meaningful for EIGHT_HOUR billing
  const excessHours =
    input.tripBillingType === "EIGHT_HOUR"
      ? Decimal.max(d(0), d(input.estimatedJobHours).sub(d(standardIncludedHours)))
      : d(0);
  const excessHoursFee = excessHours.mul(additionalHourRate);
  if (excessHours.gt(0)) {
    warnings.push({
      code: "JOB_HOURS",
      level: "INFO",
      message: `Job exceeds ${standardIncludedHours}-hour standard by ${excessHours.toNumber()} hour(s). Excess hours charge ₱${dp2(excessHoursFee).toLocaleString("en-PH")} applied.`,
    });
  }

  const extraDropoffs = Decimal.max(d(0), d(input.numberOfDropoffs).sub(d(1)));
  const extraDropoffsFee = extraDropoffs.mul(additionalDropoffCharge);

  const otherDirectSubtotal = condoFee
    .add(cateringFee)
    .add(loadingFee)
    .add(additionalHelperFee)
    .add(excessHoursFee)
    .add(extraDropoffsFee);

  // ── Base costs (everything that gets marked up, including toll) ──────────
  const tollFee = d(input.tollFee);
  const baseCosts = fuelCost.add(tripBase).add(distanceCharge).add(otherDirectSubtotal).add(tollFee);

  // ── Long-distance trigger (auto-derived from distance) ───────────────────
  const isLongDistance = input.estimatedDistanceKm >= longDistanceThresholdKm;
  if (isLongDistance) {
    warnings.push({
      code: "LONG_DISTANCE_APPLIED",
      level: "INFO",
      message: `Distance ${input.estimatedDistanceKm} km meets/exceeds ${longDistanceThresholdKm} km threshold — long-distance surcharge applied.`,
    });
  }

  // ── Markup total ─────────────────────────────────────────────────────────
  const markupRate = driverRate
    .add(helperRate)
    .add(overheadRate)
    .add(isLongDistance ? longDistanceRate : d(0));

  if (markupRate.gte(1)) {
    throw new PricingValidationError(
      `Total markup rate ${pct4(markupRate.mul(100))}% must be less than 100% — division would fail.`,
    );
  }

  // ── Revenue Net of VAT (the core circular-equation solution) ─────────────
  const revenueNetOfVat = baseCosts.div(d(1).sub(markupRate));

  // ── Allocations (for reporting, sum to revenue − base) ───────────────────
  const allocations: Allocations = {
    driver: dp2(revenueNetOfVat.mul(driverRate)),
    helper: dp2(revenueNetOfVat.mul(helperRate)),
    overhead: dp2(revenueNetOfVat.mul(overheadRate)),
    longDistance: isLongDistance ? dp2(revenueNetOfVat.mul(longDistanceRate)) : 0,
  };

  // ── Discount applied to revenue (pre-VAT, pre-toll) ──────────────────────
  const discountAmount = d(input.discountAmount);
  const revenueAfterDiscount = revenueNetOfVat.sub(discountAmount);
  if (discountAmount.gt(0)) {
    warnings.push({
      code: "DISCOUNT_APPLIED",
      level: "INFO",
      message: `Discount of ₱${dp2(discountAmount).toLocaleString("en-PH")} applied before VAT.`,
    });
  }

  // ── VAT (12% by default; locked at BIR rate) ─────────────────────────────
  let vatAmount: Decimal;
  if (input.vatOption === "NON_VAT") {
    vatAmount = d(0);
  } else {
    // For both VAT_INCLUSIVE and VAT_EXCLUSIVE, VAT amount is the same.
    // The difference is purely how it's displayed/labeled on the receipt.
    vatAmount = revenueAfterDiscount.mul(vatRate);
  }

  // ── Computed final price (revenue + VAT) ─────────────────────────────────
  const computedFinalPrice = revenueAfterDiscount.add(vatAmount);

  // ── Manual override resolution (admin-set negotiated final) ──────────────
  let finalPrice: Decimal;
  let effectiveVat: Decimal;
  let effectiveRevenue: Decimal;
  let manualOverridePrice: number | null;

  if (
    input.manualOverridePrice !== undefined &&
    input.manualOverridePrice !== null &&
    input.manualOverridePrice > 0
  ) {
    finalPrice = d(input.manualOverridePrice);
    manualOverridePrice = input.manualOverridePrice;
    warnings.push({
      code: "OVERRIDE_APPLIED",
      level: "WARNING",
      message: `Manual override active: final price ₱${dp2(finalPrice).toLocaleString("en-PH")} (computed ₱${dp2(computedFinalPrice).toLocaleString("en-PH")}).`,
    });

    // Back-compute VAT from the override (toll is already inside revenue via base costs)
    if (input.vatOption === "NON_VAT") {
      effectiveVat = d(0);
      effectiveRevenue = finalPrice;
    } else {
      // finalPrice = revenue × (1 + vatRate)  →  revenue = finalPrice / (1 + vatRate)
      effectiveRevenue = finalPrice.div(d(1).add(vatRate));
      effectiveVat = finalPrice.sub(effectiveRevenue);
    }
  } else {
    finalPrice = computedFinalPrice;
    manualOverridePrice = null;
    effectiveVat = vatAmount;
    effectiveRevenue = revenueAfterDiscount;
  }

  // ── Other direct costs breakdown for reporting ──────────────────────────
  const otherDirectCosts: OtherDirectCosts = {
    condoFee: dp2(condoFee),
    cateringFee: dp2(cateringFee),
    loadingUnloadingFee: dp2(loadingFee),
    additionalHelperFee: dp2(additionalHelperFee),
    excessHoursFee: dp2(excessHoursFee),
    extraDropoffsFee: dp2(extraDropoffsFee),
    subtotal: dp2(otherDirectSubtotal),
  };

  return {
    fuelCost: dp2(fuelCost),
    tripBase: dp2(tripBase),
    distanceCharge: dp2(distanceCharge),
    otherDirectCosts,
    baseCosts: dp2(baseCosts),

    isLongDistance,
    markupRate: pct4(markupRate),
    allocations,

    revenueNetOfVat: dp2(revenueNetOfVat),
    discountAmount: dp2(discountAmount),
    revenueAfterDiscount: dp2(revenueAfterDiscount),
    vatAmount: dp2(vatAmount),
    vatOption: input.vatOption,

    tollFee: dp2(tollFee),

    computedFinalPrice: dp2(computedFinalPrice),
    manualOverridePrice,
    finalPrice: dp2(finalPrice),
    effectiveVatAmount: dp2(effectiveVat),
    effectiveRevenueNetOfVat: dp2(effectiveRevenue),

    warnings,
    inputsSnapshot: { ...input },
    ratesSnapshot: {
      driverRate: settings.driverRate.toNumber(),
      helperRate: settings.helperRate.toNumber(),
      overheadRate: settings.overheadRate.toNumber(),
      longDistanceRate: settings.longDistanceRate.toNumber(),
      longDistanceThresholdKm,
      fuelFloor: settings.fuelFloor.toNumber(),
      fuelEfficiencyKmpl: settings.fuelEfficiencyKmpl.toNumber(),
      dieselPricePerLiter: settings.dieselPricePerLiter.toNumber(),
      distanceRatePerKm: settings.distanceRatePerKm.toNumber(),
      additionalHourRate: settings.additionalHourRate.toNumber(),
      additionalHelperRate: settings.additionalHelperRate.toNumber(),
      additionalDropoffCharge: settings.additionalDropoffCharge.toNumber(),
      standardIncludedHours,
      condoHandlingFee: settings.condoHandlingFee.toNumber(),
      cateringHandlingFee: settings.cateringHandlingFee.toNumber(),
      loadingUnloadingFee: settings.loadingUnloadingFee.toNumber(),
      vatRate: settings.vatRate.toNumber(),
      eightHourBaseRate: truckType.eightHourBaseRate.toNumber(),
      perTripBaseRate: truckType.perTripBaseRate.toNumber(),
    },
    computedAt: new Date().toISOString(),
  };
}
