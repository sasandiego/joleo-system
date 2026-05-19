export interface PricingInput {
  estimatedDistanceKm: number;
  estimatedJobHours: number;
  includedHours: number;
  numberOfHelpers: number;
  numberOfDropoffs: number;
  condoService: boolean;
  cateringService: boolean;
  nightDelivery: boolean;
  additionalHelper: boolean;
  outOfTown: boolean;
  longDistance: boolean;
  tollFee: number;
  parkingFee: number;
  fuelPriceOverride?: number;
  discountAmount: number;
  vatOption: "VAT_INCLUSIVE" | "VAT_EXCLUSIVE" | "NON_VAT";
}

// Minimal structural interface — satisfied by Prisma TruckType (Decimal fields have .toNumber())
export interface TruckTypeForPricing {
  minBaseRate: { toNumber(): number };
  fuelKmPerLiter: { toNumber(): number };
}

// Minimal structural interface — satisfied by Prisma RateSettings
export interface RateSettingsForPricing {
  dieselPricePerLiter: { toNumber(): number };
  fuelSurchargePct: { toNumber(): number };
  driverDailyRate: { toNumber(): number };
  helperDailyRate: { toNumber(): number };
  additionalHelperRate: { toNumber(): number };
  additionalHourRate: { toNumber(): number };
  additionalDropoffCharge: { toNumber(): number };
  condoHandlingFee: { toNumber(): number };
  cateringHandlingFee: { toNumber(): number };
  loadingUnloadingFee: { toNumber(): number };
  nightDeliverySurcharge: { toNumber(): number };
  outOfTownSurcharge: { toNumber(): number };
  longDistanceSurcharge: { toNumber(): number };
  distanceRatePerKm: { toNumber(): number };
  maintenancePctOfBase: { toNumber(): number };
  overheadPctOfDirect: { toNumber(): number };
  contingencyPctOfDirect: { toNumber(): number };
  floorMarginPct: { toNumber(): number };
  targetMarginPct: { toNumber(): number };
  ceilingMarginPct: { toNumber(): number };
  vatRate: { toNumber(): number };
}

export interface PricingContext {
  truckType: TruckTypeForPricing;
  settings: RateSettingsForPricing;
}

export interface LineItem {
  code: string;
  label: string;
  basis: string;
  amount: number;
}

export interface PricingWarning {
  code: "PRICE_VS_FLOOR" | "JOB_HOURS" | "PROFIT_MARGIN";
  level: "OK" | "WARNING" | "ERROR";
  message: string;
}

export interface PricingResult {
  lineItems: LineItem[];
  directCostSubtotal: number;
  overheadAllocation: number;
  contingencyBuffer: number;
  totalCostBeforeProfit: number;
  floorPrice: number;
  targetPrice: number;
  ceilingPrice: number;
  discountAmount: number;
  priceAfterDiscount: number;
  vatAmount: number;
  finalPrice: number;
  actualMarginPct: number;
  warnings: PricingWarning[];
  inputsSnapshot: PricingInput;
  computedAt: string;
}
