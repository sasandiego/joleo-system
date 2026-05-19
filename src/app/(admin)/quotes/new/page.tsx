import { db } from "@/lib/db";
import { QuoteBuilderForm } from "@/components/quotes/QuoteBuilderForm";

export default async function NewQuotePage() {
  const [clients, truckTypes, routeAreas, settings] = await Promise.all([
    db.client.findMany({
      where: { isActive: true },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true, contactPerson: true },
    }),
    db.truckType.findMany({
      orderBy: { sizeFt: "asc" },
      select: {
        id: true,
        code: true,
        label: true,
        sizeFt: true,
        wheelType: true,
        minBaseRate: true,
        fuelKmPerLiter: true,
      },
    }),
    db.routeArea.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
    db.rateSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);

  const settingsForClient = {
    dieselPricePerLiter: settings.dieselPricePerLiter.toNumber(),
    fuelSurchargePct: settings.fuelSurchargePct.toNumber(),
    driverDailyRate: settings.driverDailyRate.toNumber(),
    helperDailyRate: settings.helperDailyRate.toNumber(),
    additionalHelperRate: settings.additionalHelperRate.toNumber(),
    additionalHourRate: settings.additionalHourRate.toNumber(),
    additionalDropoffCharge: settings.additionalDropoffCharge.toNumber(),
    condoHandlingFee: settings.condoHandlingFee.toNumber(),
    cateringHandlingFee: settings.cateringHandlingFee.toNumber(),
    loadingUnloadingFee: settings.loadingUnloadingFee.toNumber(),
    nightDeliverySurcharge: settings.nightDeliverySurcharge.toNumber(),
    outOfTownSurcharge: settings.outOfTownSurcharge.toNumber(),
    longDistanceSurcharge: settings.longDistanceSurcharge.toNumber(),
    distanceRatePerKm: settings.distanceRatePerKm.toNumber(),
    maintenancePctOfBase: settings.maintenancePctOfBase.toNumber(),
    overheadPctOfDirect: settings.overheadPctOfDirect.toNumber(),
    contingencyPctOfDirect: settings.contingencyPctOfDirect.toNumber(),
    floorMarginPct: settings.floorMarginPct.toNumber(),
    targetMarginPct: settings.targetMarginPct.toNumber(),
    ceilingMarginPct: settings.ceilingMarginPct.toNumber(),
    vatRate: settings.vatRate.toNumber(),
    standardIncludedHours: settings.standardIncludedHours,
  };

  const truckTypesForClient = truckTypes.map((t) => ({
    id: t.id,
    code: t.code,
    label: t.label,
    sizeFt: t.sizeFt,
    wheelType: t.wheelType,
    minBaseRate: t.minBaseRate.toNumber(),
    fuelKmPerLiter: t.fuelKmPerLiter.toNumber(),
  }));

  return (
    <QuoteBuilderForm
      clients={clients}
      truckTypes={truckTypesForClient}
      routeAreas={routeAreas}
      settings={settingsForClient}
    />
  );
}
