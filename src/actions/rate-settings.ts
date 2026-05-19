"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { revalidatePath } from "next/cache";

const schema = z.object({
  dieselPricePerLiter: z.coerce.number().positive(),
  fuelSurchargePct: z.coerce.number().min(0).max(100),
  driverDailyRate: z.coerce.number().positive(),
  driverOtRate: z.coerce.number().nonnegative(),
  helperDailyRate: z.coerce.number().positive(),
  helperOtRate: z.coerce.number().nonnegative(),
  additionalHelperRate: z.coerce.number().nonnegative(),
  standardIncludedHours: z.coerce.number().int().positive(),
  additionalHourRate: z.coerce.number().nonnegative(),
  additionalDropoffCharge: z.coerce.number().nonnegative(),
  condoHandlingFee: z.coerce.number().nonnegative(),
  cateringHandlingFee: z.coerce.number().nonnegative(),
  loadingUnloadingFee: z.coerce.number().nonnegative(),
  nightDeliverySurcharge: z.coerce.number().nonnegative(),
  waitingTimeChargePerHr: z.coerce.number().nonnegative(),
  outOfTownSurcharge: z.coerce.number().nonnegative(),
  longDistanceSurcharge: z.coerce.number().nonnegative(),
  distanceRatePerKm: z.coerce.number().nonnegative(),
  maintenancePctOfBase: z.coerce.number().min(0).max(100),
  overheadPctOfDirect: z.coerce.number().min(0).max(100),
  contingencyPctOfDirect: z.coerce.number().min(0).max(100),
  floorMarginPct: z.coerce.number().min(0).max(100),
  targetMarginPct: z.coerce.number().min(0).max(100),
  ceilingMarginPct: z.coerce.number().min(0).max(100),
  vatRate: z.coerce.number().min(0).max(100),
});

export type RateSettingsState = { success?: boolean; error?: string } | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeForLog(obj: Record<string, any>): Record<string, number | string | boolean | null> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v !== null && typeof v === "object" && "toNumber" in v) {
        return [k, (v as { toNumber(): number }).toNumber()];
      }
      if (v instanceof Date) return [k, v.toISOString()];
      return [k, v as number | string | boolean | null];
    })
  );
}

export async function updateRateSettingsAction(
  _prevState: RateSettingsState,
  formData: FormData
): Promise<RateSettingsState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation error." };
  }

  const d = parsed.data;

  const before = await db.rateSettings.findUnique({ where: { id: 1 } });

  const after = await db.rateSettings.update({
    where: { id: 1 },
    data: {
      dieselPricePerLiter: d.dieselPricePerLiter,
      fuelSurchargePct: d.fuelSurchargePct / 100,
      driverDailyRate: d.driverDailyRate,
      driverOtRate: d.driverOtRate,
      helperDailyRate: d.helperDailyRate,
      helperOtRate: d.helperOtRate,
      additionalHelperRate: d.additionalHelperRate,
      standardIncludedHours: d.standardIncludedHours,
      additionalHourRate: d.additionalHourRate,
      additionalDropoffCharge: d.additionalDropoffCharge,
      condoHandlingFee: d.condoHandlingFee,
      cateringHandlingFee: d.cateringHandlingFee,
      loadingUnloadingFee: d.loadingUnloadingFee,
      nightDeliverySurcharge: d.nightDeliverySurcharge,
      waitingTimeChargePerHr: d.waitingTimeChargePerHr,
      outOfTownSurcharge: d.outOfTownSurcharge,
      longDistanceSurcharge: d.longDistanceSurcharge,
      distanceRatePerKm: d.distanceRatePerKm,
      maintenancePctOfBase: d.maintenancePctOfBase / 100,
      overheadPctOfDirect: d.overheadPctOfDirect / 100,
      contingencyPctOfDirect: d.contingencyPctOfDirect / 100,
      floorMarginPct: d.floorMarginPct / 100,
      targetMarginPct: d.targetMarginPct / 100,
      ceilingMarginPct: d.ceilingMarginPct / 100,
      vatRate: d.vatRate / 100,
      updatedBy: session.user.username as string,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id as string,
      action: "RATE_SETTINGS_UPDATED",
      entityType: "RateSettings",
      entityId: "1",
      before: before ? serializeForLog(before as Record<string, unknown>) : undefined,
      after: serializeForLog(after as Record<string, unknown>),
    },
  });

  revalidatePath("/rate-settings");
  return { success: true };
}
