// Pricing engine types — bottom-up revenue model.
// Refactored per Joleo_Update_Guide.md SECTION B.

export type BillingType = "EIGHT_HOUR" | "PER_TRIP";

export type VatOption = "VAT_INCLUSIVE" | "VAT_EXCLUSIVE" | "NON_VAT";

export interface PricingInput {
  // Trip details
  estimatedDistanceKm: number;
  estimatedJobHours: number; // total hours for the trip (used for excess-hour calc when EIGHT_HOUR)
  tripBillingType: BillingType;

  // Crew + flags
  numberOfDropoffs: number; // default 1
  condoService: boolean;
  cateringService: boolean;
  additionalHelper: boolean;

  // Pass-through + overrides
  tollFee: number; // included in VAT base: vatBase = revenueAfterDiscount + tollFee
  fuelPriceOverride?: number; // overrides RateSettings.dieselPricePerLiter for this quote
  discountAmount: number; // peso amount, subtracted from Revenue Net of VAT
  vatOption: VatOption;
  manualOverridePrice?: number; // when set, becomes the final price (gross, includes VAT + toll)
}

// Minimal structural interface — satisfied by Prisma TruckType
export interface TruckTypeForPricing {
  eightHourBaseRate: { toNumber(): number };
  perTripBaseRate: { toNumber(): number };
}

// Minimal structural interface — satisfied by Prisma RateSettings (post-refactor)
export interface RateSettingsForPricing {
  // Labor markups
  driverRate: { toNumber(): number };
  helperRate: { toNumber(): number };

  // Overhead & surcharges
  overheadRate: { toNumber(): number };
  longDistanceRate: { toNumber(): number };
  longDistanceThresholdKm: number;

  // Fuel
  dieselPricePerLiter: { toNumber(): number };
  fuelFloor: { toNumber(): number };
  fuelEfficiencyKmpl: { toNumber(): number };

  // Add-on rates
  additionalHelperRate: { toNumber(): number };
  additionalHourRate: { toNumber(): number };
  additionalDropoffCharge: { toNumber(): number };
  standardIncludedHours: number;

  // Special service fees
  condoHandlingFee: { toNumber(): number };
  cateringHandlingFee: { toNumber(): number };
  loadingUnloadingFee: { toNumber(): number };

  // Distance
  distanceRatePerKm: { toNumber(): number };

  // Tax
  vatRate: { toNumber(): number };
}

export interface PricingContext {
  truckType: TruckTypeForPricing;
  settings: RateSettingsForPricing;
}

export interface OtherDirectCosts {
  condoFee: number;
  cateringFee: number;
  loadingUnloadingFee: number;
  additionalHelperFee: number;
  excessHoursFee: number;
  extraDropoffsFee: number;
  subtotal: number;
}

export interface Allocations {
  driver: number;
  helper: number;
  overhead: number;
  longDistance: number; // 0 when not triggered
}

export interface PricingWarning {
  code: "LONG_DISTANCE_APPLIED" | "FUEL_FLOOR_APPLIED" | "DISCOUNT_APPLIED" | "OVERRIDE_APPLIED" | "JOB_HOURS";
  level: "OK" | "INFO" | "WARNING" | "ERROR";
  message: string;
}

export interface PricingResult {
  // Base components
  fuelCost: number;
  tripBase: number;
  distanceCharge: number;
  otherDirectCosts: OtherDirectCosts;
  baseCosts: number;

  // Markup
  isLongDistance: boolean;
  markupRate: number;
  allocations: Allocations;

  // Revenue + VAT
  revenueNetOfVat: number; // before discount
  discountAmount: number;
  revenueAfterDiscount: number; // = revenueNetOfVat − discount
  vatAmount: number;
  vatOption: VatOption;

  // Toll (included in VAT base)
  tollFee: number;

  // Final
  computedFinalPrice: number; // engine output: (revenueAfterDiscount + toll) × (1 + vatRate)
  manualOverridePrice: number | null;
  finalPrice: number; // override if set, else computed

  // Effective VAT when override is set (back-computed from override − toll)
  effectiveVatAmount: number;
  effectiveRevenueNetOfVat: number;

  // Metadata
  warnings: PricingWarning[];
  inputsSnapshot: PricingInput;
  ratesSnapshot: {
    driverRate: number;
    helperRate: number;
    overheadRate: number;
    longDistanceRate: number;
    longDistanceThresholdKm: number;
    fuelFloor: number;
    fuelEfficiencyKmpl: number;
    dieselPricePerLiter: number;
    distanceRatePerKm: number;
    additionalHourRate: number;
    additionalHelperRate: number;
    additionalDropoffCharge: number;
    standardIncludedHours: number;
    condoHandlingFee: number;
    cateringHandlingFee: number;
    loadingUnloadingFee: number;
    vatRate: number;
    eightHourBaseRate: number;
    perTripBaseRate: number;
  };
  computedAt: string;
}

// Custom error class for engine validation failures
export class PricingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingValidationError";
  }
}
