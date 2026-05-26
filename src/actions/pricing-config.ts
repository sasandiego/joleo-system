"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { revalidatePath } from "next/cache";

// Reject empty/whitespace strings before coercion.
// Without this, z.coerce.number() turns "" into 0 — silently saving a cleared
// numeric field as ₱0 / 0%. Empty becomes undefined so the inner schema fails
// with "Required" instead of accepting 0.
const num = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), inner);

// Percentages come in as 0-100 from the UI; stored as 0-1 fractions.
const schema = z.object({
  // Labor markups (percent inputs)
  driverRate: num(z.coerce.number().min(0).max(100)),
  helperRate: num(z.coerce.number().min(0).max(100)),

  // Overhead & surcharges
  overheadRate: num(z.coerce.number().min(0).max(100)),
  longDistanceRate: num(z.coerce.number().min(0).max(100)),
  longDistanceThresholdKm: num(z.coerce.number().int().positive()),

  // Fuel config
  dieselPricePerLiter: num(z.coerce.number().positive()),
  fuelFloor: num(z.coerce.number().nonnegative()),
  fuelEfficiencyKmpl: num(z.coerce.number().positive()),

  // Add-on rates
  additionalHourRate: num(z.coerce.number().nonnegative()),
  additionalDropoffCharge: num(z.coerce.number().nonnegative()),
  standardIncludedHours: num(z.coerce.number().int().positive()),

  // Service fees
  difficultAccessFee: num(z.coerce.number().nonnegative()),
  cateringHandlingFee: num(z.coerce.number().nonnegative()),
  loadingUnloadingFee: num(z.coerce.number().nonnegative()),

  // Distance
  distanceRatePerKm: num(z.coerce.number().nonnegative()),

  // Per-truck-type rates: arrive as JSON string from the form
  truckTypeRates: z.string(),
});

export type PricingConfigState = { success?: boolean; error?: string } | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeForLog(obj: Record<string, any>): Record<string, number | string | boolean | null> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v !== null && typeof v === "object" && "toNumber" in v) {
        return [k, (v as { toNumber(): number }).toNumber()];
      }
      if (v instanceof Date) return [k, v.toISOString()];
      return [k, v as number | string | boolean | null];
    }),
  );
}

// Truck-type base rates must be positive — a ₱0 rate is always a misconfiguration.
const truckRateSchema = z.array(
  z.object({
    id: z.string().min(1),
    eightHourBaseRate: z.number().positive(),
    perTripBaseRate: z.number().positive(),
  }),
);

export async function updatePricingConfigAction(
  _prevState: PricingConfigState,
  formData: FormData,
): Promise<PricingConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.join(".") ?? "field";
    // Empty string → preprocess returns undefined → z.coerce.number coerces to NaN.
    // Rewrite the resulting "Expected number, received nan" to a clearer "is required".
    const message =
      issue?.message === "Expected number, received nan"
        ? "is required (cannot be empty)"
        : issue?.message ?? "Validation error.";
    return { error: `${field}: ${message}` };
  }

  const d = parsed.data;

  // Validate markup-sum < 100% (engine requires this — guide SECTION C)
  const totalMarkup = d.driverRate + d.helperRate + d.overheadRate + d.longDistanceRate;
  if (totalMarkup >= 100) {
    return {
      error: `Sum of markup rates (${totalMarkup.toFixed(1)}%) must be less than 100%. Division would fail.`,
    };
  }

  // Parse per-truck-type rates
  let truckTypeRates: { id: string; eightHourBaseRate: number; perTripBaseRate: number }[];
  try {
    truckTypeRates = truckRateSchema.parse(JSON.parse(d.truckTypeRates));
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issue = e.issues[0];
      const field = issue?.path?.join(".") ?? "truck rate";
      return { error: `Truck rates — ${field}: ${issue?.message ?? "invalid"}` };
    }
    return { error: "Invalid truck-type rates payload." };
  }

  const before = await db.rateSettings.findUnique({ where: { id: 1 } });
  const beforeTrucks = await db.truckType.findMany({
    select: { id: true, code: true, eightHourBaseRate: true, perTripBaseRate: true },
  });

  // Update RateSettings singleton
  const after = await db.rateSettings.update({
    where: { id: 1 },
    data: {
      driverRate: d.driverRate / 100,
      helperRate: d.helperRate / 100,
      overheadRate: d.overheadRate / 100,
      longDistanceRate: d.longDistanceRate / 100,
      longDistanceThresholdKm: d.longDistanceThresholdKm,
      dieselPricePerLiter: d.dieselPricePerLiter,
      fuelFloor: d.fuelFloor,
      fuelEfficiencyKmpl: d.fuelEfficiencyKmpl,
      additionalHourRate: d.additionalHourRate,
      additionalDropoffCharge: d.additionalDropoffCharge,
      standardIncludedHours: d.standardIncludedHours,
      difficultAccessFee: d.difficultAccessFee,
      // (additionalHelperRate removed — helper cost now scales via helperRate × numberOfHelpers)
      cateringHandlingFee: d.cateringHandlingFee,
      loadingUnloadingFee: d.loadingUnloadingFee,
      distanceRatePerKm: d.distanceRatePerKm,
      updatedBy: session.user.username as string,
    },
  });

  // Update per-truck-type rates
  for (const t of truckTypeRates) {
    await db.truckType.update({
      where: { id: t.id },
      data: {
        eightHourBaseRate: t.eightHourBaseRate,
        perTripBaseRate: t.perTripBaseRate,
      },
    });
  }

  const afterTrucks = await db.truckType.findMany({
    select: { id: true, code: true, eightHourBaseRate: true, perTripBaseRate: true },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id as string,
      action: "PRICING_CONFIG_UPDATED",
      entityType: "RateSettings",
      entityId: "1",
      before: before
        ? {
            settings: serializeForLog(before as Record<string, unknown>),
            truckTypes: beforeTrucks.map((t) => serializeForLog(t as Record<string, unknown>)),
          }
        : undefined,
      after: {
        settings: serializeForLog(after as Record<string, unknown>),
        truckTypes: afterTrucks.map((t) => serializeForLog(t as Record<string, unknown>)),
      },
    },
  });

  revalidatePath("/pricing-config");
  return { success: true };
}

export async function resetPricingConfigDefaultsAction(): Promise<PricingConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated." };

  const before = await db.rateSettings.findUnique({ where: { id: 1 } });

  await db.rateSettings.update({
    where: { id: 1 },
    data: {
      driverRate: 0.15,
      helperRate: 0.075,
      overheadRate: 0.05,
      longDistanceRate: 0.05,
      longDistanceThresholdKm: 40,
      dieselPricePerLiter: 70,
      fuelFloor: 500,
      fuelEfficiencyKmpl: 5,
      additionalHourRate: 350,
      additionalDropoffCharge: 300,
      standardIncludedHours: 8,
      difficultAccessFee: 500,
      cateringHandlingFee: 400,
      loadingUnloadingFee: 0,
      distanceRatePerKm: 30,
      updatedBy: session.user.username as string,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id as string,
      action: "PRICING_CONFIG_RESET_DEFAULTS",
      entityType: "RateSettings",
      entityId: "1",
      before: before ? serializeForLog(before as Record<string, unknown>) : undefined,
    },
  });

  revalidatePath("/pricing-config");
  return { success: true };
}
