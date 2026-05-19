import { db } from "@/lib/db";
import { RateSettingsForm } from "@/components/rate-settings/RateSettingsForm";

export default async function RateSettingsPage() {
  const raw = await db.rateSettings.findUniqueOrThrow({ where: { id: 1 } });

  const settings = {
    dieselPricePerLiter: raw.dieselPricePerLiter.toNumber(),
    fuelSurchargePct: parseFloat((raw.fuelSurchargePct.toNumber() * 100).toFixed(4)),
    driverDailyRate: raw.driverDailyRate.toNumber(),
    driverOtRate: raw.driverOtRate.toNumber(),
    helperDailyRate: raw.helperDailyRate.toNumber(),
    helperOtRate: raw.helperOtRate.toNumber(),
    additionalHelperRate: raw.additionalHelperRate.toNumber(),
    standardIncludedHours: raw.standardIncludedHours,
    additionalHourRate: raw.additionalHourRate.toNumber(),
    additionalDropoffCharge: raw.additionalDropoffCharge.toNumber(),
    condoHandlingFee: raw.condoHandlingFee.toNumber(),
    cateringHandlingFee: raw.cateringHandlingFee.toNumber(),
    loadingUnloadingFee: raw.loadingUnloadingFee.toNumber(),
    nightDeliverySurcharge: raw.nightDeliverySurcharge.toNumber(),
    waitingTimeChargePerHr: raw.waitingTimeChargePerHr.toNumber(),
    outOfTownSurcharge: raw.outOfTownSurcharge.toNumber(),
    longDistanceSurcharge: raw.longDistanceSurcharge.toNumber(),
    distanceRatePerKm: raw.distanceRatePerKm.toNumber(),
    maintenancePctOfBase: parseFloat((raw.maintenancePctOfBase.toNumber() * 100).toFixed(4)),
    overheadPctOfDirect: parseFloat((raw.overheadPctOfDirect.toNumber() * 100).toFixed(4)),
    contingencyPctOfDirect: parseFloat((raw.contingencyPctOfDirect.toNumber() * 100).toFixed(4)),
    floorMarginPct: parseFloat((raw.floorMarginPct.toNumber() * 100).toFixed(4)),
    targetMarginPct: parseFloat((raw.targetMarginPct.toNumber() * 100).toFixed(4)),
    ceilingMarginPct: parseFloat((raw.ceilingMarginPct.toNumber() * 100).toFixed(4)),
    vatRate: parseFloat((raw.vatRate.toNumber() * 100).toFixed(4)),
    updatedAt: raw.updatedAt.toISOString(),
    updatedBy: raw.updatedBy,
  };

  const rawChangelog = await db.auditLog.findMany({
    where: { action: "RATE_SETTINGS_UPDATED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const changelog = rawChangelog.map((e) => ({
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    userId: e.userId,
    before: e.before as Record<string, unknown> | null,
    after: e.after as Record<string, unknown> | null,
  }));

  return <RateSettingsForm settings={settings} changelog={changelog} />;
}
