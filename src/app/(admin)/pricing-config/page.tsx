import { db } from "@/lib/db";
import { PricingConfigForm } from "@/components/pricing-config/PricingConfigForm";

export default async function PricingConfigPage() {
  const raw = await db.rateSettings.findUniqueOrThrow({ where: { id: 1 } });
  const truckTypes = await db.truckType.findMany({
    orderBy: { sizeFt: "asc" },
    select: {
      id: true,
      code: true,
      label: true,
      sizeFt: true,
      wheelType: true,
      eightHourBaseRate: true,
      perTripBaseRate: true,
    },
  });

  const settings = {
    // Markups (×100 for display as percent)
    driverRate: parseFloat((raw.driverRate.toNumber() * 100).toFixed(4)),
    helperRate: parseFloat((raw.helperRate.toNumber() * 100).toFixed(4)),
    overheadRate: parseFloat((raw.overheadRate.toNumber() * 100).toFixed(4)),
    longDistanceRate: parseFloat((raw.longDistanceRate.toNumber() * 100).toFixed(4)),
    longDistanceThresholdKm: raw.longDistanceThresholdKm,
    // Fuel
    dieselPricePerLiter: raw.dieselPricePerLiter.toNumber(),
    fuelFloor: raw.fuelFloor.toNumber(),
    fuelEfficiencyKmpl: raw.fuelEfficiencyKmpl.toNumber(),
    // Add-ons
    additionalHourRate: raw.additionalHourRate.toNumber(),
    additionalDropoffCharge: raw.additionalDropoffCharge.toNumber(),
    standardIncludedHours: raw.standardIncludedHours,
    // Service fees
    difficultAccessFee: raw.difficultAccessFee.toNumber(),
    cateringHandlingFee: raw.cateringHandlingFee.toNumber(),
    loadingUnloadingFee: raw.loadingUnloadingFee.toNumber(),
    // Distance
    distanceRatePerKm: raw.distanceRatePerKm.toNumber(),
    // VAT (locked, displayed as percent)
    vatRate: parseFloat((raw.vatRate.toNumber() * 100).toFixed(4)),
    updatedAt: raw.updatedAt.toISOString(),
    updatedBy: raw.updatedBy,
  };

  const truckTypesForClient = truckTypes.map((t) => ({
    id: t.id,
    code: t.code,
    label: t.label,
    sizeFt: t.sizeFt,
    wheelType: t.wheelType,
    eightHourBaseRate: t.eightHourBaseRate.toNumber(),
    perTripBaseRate: t.perTripBaseRate.toNumber(),
  }));

  const rawChangelog = await db.auditLog.findMany({
    where: { action: { in: ["PRICING_CONFIG_UPDATED", "PRICING_CONFIG_RESET_DEFAULTS"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const changelog = rawChangelog.map((e) => ({
    id: e.id,
    action: e.action,
    createdAt: e.createdAt.toISOString(),
    userId: e.userId,
  }));

  return (
    <PricingConfigForm settings={settings} truckTypes={truckTypesForClient} changelog={changelog} />
  );
}
