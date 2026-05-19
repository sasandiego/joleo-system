import Decimal from "decimal.js";
import type { PricingInput, PricingContext, PricingResult, LineItem, PricingWarning } from "./types";

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

export function computePrice(input: PricingInput, ctx: PricingContext): PricingResult {
  const { truckType, settings } = ctx;

  // ── Pull all context values into Decimal ─────────────────────────────────
  const minBaseRate = d(truckType.minBaseRate.toNumber());
  const fuelKmPerLiter = d(truckType.fuelKmPerLiter.toNumber());

  const effectiveDieselPrice =
    input.fuelPriceOverride !== undefined
      ? d(input.fuelPriceOverride)
      : d(settings.dieselPricePerLiter.toNumber());

  const fuelSurchargePct = d(settings.fuelSurchargePct.toNumber());
  const driverDailyRate = d(settings.driverDailyRate.toNumber());
  const helperDailyRate = d(settings.helperDailyRate.toNumber());
  const additionalHelperRate = d(settings.additionalHelperRate.toNumber());
  const additionalHourRate = d(settings.additionalHourRate.toNumber());
  const additionalDropoffCharge = d(settings.additionalDropoffCharge.toNumber());
  const condoHandlingFee = d(settings.condoHandlingFee.toNumber());
  const cateringHandlingFee = d(settings.cateringHandlingFee.toNumber());
  const loadingUnloadingFee = d(settings.loadingUnloadingFee.toNumber());
  const nightDeliverySurcharge = d(settings.nightDeliverySurcharge.toNumber());
  const outOfTownSurcharge = d(settings.outOfTownSurcharge.toNumber());
  const longDistanceSurcharge = d(settings.longDistanceSurcharge.toNumber());
  const distanceRatePerKm = d(settings.distanceRatePerKm.toNumber());
  const maintenancePctOfBase = d(settings.maintenancePctOfBase.toNumber());
  const overheadPctOfDirect = d(settings.overheadPctOfDirect.toNumber());
  const contingencyPctOfDirect = d(settings.contingencyPctOfDirect.toNumber());
  const floorMarginPct = d(settings.floorMarginPct.toNumber());
  const targetMarginPct = d(settings.targetMarginPct.toNumber());
  const ceilingMarginPct = d(settings.ceilingMarginPct.toNumber());
  const vatRate = d(settings.vatRate.toNumber());

  // ── Input values as Decimal ───────────────────────────────────────────────
  const distanceKm = d(input.estimatedDistanceKm);
  const jobHours = d(input.estimatedJobHours);
  const includedHours = d(input.includedHours);
  const numHelpers = d(input.numberOfHelpers);
  const numDropoffs = d(input.numberOfDropoffs);
  const tollFee = d(input.tollFee);
  const parkingFee = d(input.parkingFee);
  const discountAmt = d(input.discountAmount);

  // ── Steps 1–16 (mirror Excel SECTION D) ──────────────────────────────────

  // Step 1: Truck base rate (min rate for selected truck type)
  const step1 = minBaseRate;

  // Step 2: Distance charge
  const step2 = distanceKm.mul(distanceRatePerKm);

  // Step 3: Fuel cost — round trip, with surcharge
  const step3 = distanceKm
    .div(fuelKmPerLiter)
    .mul(effectiveDieselPrice)
    .mul(2)
    .mul(d(1).add(fuelSurchargePct));

  // Step 4: Driver daily rate (flat)
  const step4 = driverDailyRate;

  // Step 5: Helper daily rate × count (flat)
  const step5 = helperDailyRate.mul(numHelpers);

  // Step 6: Additional helper (boolean flag)
  const step6 = input.additionalHelper ? additionalHelperRate : d(0);

  // Step 7: Excess hours beyond included (single blended rate for entire crew)
  const excessHours = Decimal.max(d(0), jobHours.sub(includedHours));
  const step7 = excessHours.mul(additionalHourRate);

  // Step 8: Extra drop-offs beyond the first
  const extraDropoffs = Decimal.max(d(0), numDropoffs.sub(d(1)));
  const step8 = extraDropoffs.mul(additionalDropoffCharge);

  // Step 9: Condo handling fee
  const step9 = input.condoService ? condoHandlingFee : d(0);

  // Step 10: Catering handling fee
  const step10 = input.cateringService ? cateringHandlingFee : d(0);

  // Step 11: Loading/unloading fee (always applied if rate > 0)
  const step11 = loadingUnloadingFee;

  // Step 12: Night delivery surcharge
  const step12 = input.nightDelivery ? nightDeliverySurcharge : d(0);

  // Step 13: Out-of-town surcharge
  const step13 = input.outOfTown ? outOfTownSurcharge : d(0);

  // Step 14: Long-distance surcharge
  const step14 = input.longDistance ? longDistanceSurcharge : d(0);

  // Step 15: Toll and parking (pass-through)
  const step15 = tollFee.add(parkingFee);

  // Step 16: Maintenance allowance (% of truck base rate)
  const step16 = step1.mul(maintenancePctOfBase);

  // ── Subtotals ─────────────────────────────────────────────────────────────
  const directCostSubtotal = step1
    .add(step2)
    .add(step3)
    .add(step4)
    .add(step5)
    .add(step6)
    .add(step7)
    .add(step8)
    .add(step9)
    .add(step10)
    .add(step11)
    .add(step12)
    .add(step13)
    .add(step14)
    .add(step15)
    .add(step16);

  const overheadAllocation = directCostSubtotal.mul(overheadPctOfDirect);
  const contingencyBuffer = directCostSubtotal.mul(contingencyPctOfDirect);
  const totalCostBeforeProfit = directCostSubtotal.add(overheadAllocation).add(contingencyBuffer);

  // ── Prices ────────────────────────────────────────────────────────────────
  const floorPrice = totalCostBeforeProfit.div(d(1).sub(floorMarginPct));
  const targetPrice = totalCostBeforeProfit.div(d(1).sub(targetMarginPct));
  const ceilingPrice = totalCostBeforeProfit.div(d(1).sub(ceilingMarginPct));

  // ── Discount and VAT ──────────────────────────────────────────────────────
  const priceAfterDiscount = targetPrice.sub(discountAmt);

  let vatAmount: Decimal;
  let finalPrice: Decimal;

  switch (input.vatOption) {
    case "VAT_EXCLUSIVE":
      vatAmount = priceAfterDiscount.mul(vatRate);
      finalPrice = priceAfterDiscount.add(vatAmount);
      break;
    case "VAT_INCLUSIVE":
      // VAT is already embedded — extract it
      vatAmount = priceAfterDiscount.sub(priceAfterDiscount.div(d(1).add(vatRate)));
      finalPrice = priceAfterDiscount;
      break;
    case "NON_VAT":
    default:
      vatAmount = d(0);
      finalPrice = priceAfterDiscount;
      break;
  }

  // ── Actual margin ─────────────────────────────────────────────────────────
  const actualMarginPct = finalPrice.isZero()
    ? d(0)
    : finalPrice.sub(totalCostBeforeProfit).div(finalPrice);

  // ── Warnings ──────────────────────────────────────────────────────────────
  const warnings: PricingWarning[] = [];

  const floorCheck = finalPrice.lt(floorPrice)
    ? ({ code: "PRICE_VS_FLOOR", level: "ERROR", message: `Final price ₱${dp2(finalPrice).toLocaleString("en-PH")} is below the floor price ₱${dp2(floorPrice).toLocaleString("en-PH")}.` } as const)
    : ({ code: "PRICE_VS_FLOOR", level: "OK", message: "Price is above floor." } as const);
  warnings.push(floorCheck);

  const hoursCheck = excessHours.gt(0)
    ? ({ code: "JOB_HOURS", level: "WARNING", message: `Job exceeds included hours by ${excessHours.toNumber()} hr(s). Excess hours charge applied.` } as const)
    : ({ code: "JOB_HOURS", level: "OK", message: "Job within included hours." } as const);
  warnings.push(hoursCheck);

  let marginCheck: PricingWarning;
  if (actualMarginPct.lt(floorMarginPct)) {
    marginCheck = { code: "PROFIT_MARGIN", level: "ERROR", message: `Actual margin ${pct4(actualMarginPct.mul(100))}% is below the floor margin ${pct4(floorMarginPct.mul(100))}%.` };
  } else if (actualMarginPct.gt(ceilingMarginPct)) {
    marginCheck = { code: "PROFIT_MARGIN", level: "WARNING", message: `Actual margin ${pct4(actualMarginPct.mul(100))}% exceeds the ceiling margin ${pct4(ceilingMarginPct.mul(100))}%.` };
  } else {
    marginCheck = { code: "PROFIT_MARGIN", level: "OK", message: `Actual margin ${pct4(actualMarginPct.mul(100))}% is within acceptable range.` };
  }
  warnings.push(marginCheck);

  // ── Line items ────────────────────────────────────────────────────────────
  const lineItems: LineItem[] = [
    { code: "TRUCK_BASE_RATE",       label: "1. Truck Base Rate",          basis: "Min rate for selected truck type",            amount: dp2(step1) },
    { code: "DISTANCE_CHARGE",       label: "2. Distance Charge",          basis: `${input.estimatedDistanceKm} km × ₱${distanceRatePerKm.toNumber()}/km`, amount: dp2(step2) },
    { code: "FUEL_COST",             label: "3. Fuel Cost",                basis: `Round trip · diesel ₱${effectiveDieselPrice.toNumber()}/L · ${fuelSurchargePct.mul(100).toNumber()}% surcharge`, amount: dp2(step3) },
    { code: "DRIVER_COST",           label: "4. Driver Daily Rate",        basis: "8-hour standard shift",                       amount: dp2(step4) },
    { code: "HELPER_COST",           label: "5. Helper Cost",              basis: `${input.numberOfHelpers} helper(s) × ₱${helperDailyRate.toNumber()}/day`, amount: dp2(step5) },
    { code: "ADDITIONAL_HELPER",     label: "6. Additional Helper",        basis: input.additionalHelper ? "Additional helper rate" : "Not applicable", amount: dp2(step6) },
    { code: "EXCESS_HOURS",          label: "7. Excess Hours Charge",      basis: excessHours.gt(0) ? `${excessHours.toNumber()} hr(s) × ₱${additionalHourRate.toNumber()}/hr` : "Within included hours", amount: dp2(step7) },
    { code: "EXTRA_DROPOFFS",        label: "8. Extra Drop-off Charge",    basis: extraDropoffs.gt(0) ? `${extraDropoffs.toNumber()} extra drop-off(s) × ₱${additionalDropoffCharge.toNumber()}` : "Single drop-off", amount: dp2(step8) },
    { code: "CONDO_FEE",             label: "9. Condo Handling Fee",       basis: input.condoService ? "Condo move-in/out surcharge" : "Not applicable",    amount: dp2(step9) },
    { code: "CATERING_FEE",          label: "10. Catering Handling Fee",   basis: input.cateringService ? "Catering delivery surcharge" : "Not applicable", amount: dp2(step10) },
    { code: "LOAD_UNLOAD_FEE",       label: "11. Loading/Unloading Fee",   basis: "Per job rate",                                amount: dp2(step11) },
    { code: "NIGHT_SURCHARGE",       label: "12. Night Delivery Surcharge",basis: input.nightDelivery ? "Delivery outside standard hours" : "Not applicable", amount: dp2(step12) },
    { code: "OUT_OF_TOWN_SURCHARGE", label: "13. Out-of-Town Surcharge",   basis: input.outOfTown ? "Beyond Metro Manila" : "Not applicable",              amount: dp2(step13) },
    { code: "LONG_DIST_SURCHARGE",   label: "14. Long-Distance Surcharge", basis: input.longDistance ? "Route exceeds 200 km one-way" : "Not applicable",  amount: dp2(step14) },
    { code: "TOLL_AND_PARKING",      label: "15. Toll & Parking",          basis: "Pass-through cost",                           amount: dp2(step15) },
    { code: "MAINTENANCE",           label: "16. Maintenance Allowance",   basis: `${maintenancePctOfBase.mul(100).toNumber()}% of truck base rate`,        amount: dp2(step16) },
  ];

  return {
    lineItems,
    directCostSubtotal: dp2(directCostSubtotal),
    overheadAllocation: dp2(overheadAllocation),
    contingencyBuffer: dp2(contingencyBuffer),
    totalCostBeforeProfit: dp2(totalCostBeforeProfit),
    floorPrice: dp2(floorPrice),
    targetPrice: dp2(targetPrice),
    ceilingPrice: dp2(ceilingPrice),
    discountAmount: dp2(discountAmt),
    priceAfterDiscount: dp2(priceAfterDiscount),
    vatAmount: dp2(vatAmount),
    finalPrice: dp2(finalPrice),
    actualMarginPct: pct4(actualMarginPct),
    warnings,
    inputsSnapshot: { ...input },
    computedAt: new Date().toISOString(),
  };
}
