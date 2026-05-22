import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { QuoteBuilderForm } from "@/components/quotes/QuoteBuilderForm";
import type { QuoteInitialValues } from "@/components/quotes/QuoteBuilderForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: Props) {
  const { id } = await params;

  const [quote, clients, truckTypes, routeAreas, settings] = await Promise.all([
    db.quote.findUnique({ where: { id } }),
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
        eightHourBaseRate: true,
        perTripBaseRate: true,
      },
    }),
    db.routeArea.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
    db.rateSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);

  if (!quote) notFound();

  const initial: QuoteInitialValues = {
    id: quote.id,
    clientId: quote.clientId ?? "",
    serviceType: quote.serviceType,
    pickupPoint: quote.pickupPoint,
    dropoffPoint: quote.dropoffPoint,
    routeAreaId: quote.routeAreaId,
    truckTypeId: quote.truckTypeId ?? truckTypes[0]?.id ?? "",
    numberOfHelpers: quote.numberOfHelpers,
    estimatedDistanceKm: quote.estimatedDistanceKm,
    estimatedHours: quote.estimatedHours ?? settings.standardIncludedHours,
    numberOfDropoffs: quote.numberOfDropoffs,
    tripBillingType: quote.tripBillingType,
    condoService: quote.condoService,
    cateringService: quote.cateringService,
    additionalHelper: quote.additionalHelper,
    tollFee: quote.tollFee.toNumber(),
    discountAmount: quote.discountAmount.toNumber(),
    manualOverridePrice: quote.manualOverridePrice?.toNumber() ?? null,
    vatOption: quote.vatOption,
    notes: quote.notes,
  };

  const settingsForClient = {
    driverRate: settings.driverRate.toNumber(),
    helperRate: settings.helperRate.toNumber(),
    overheadRate: settings.overheadRate.toNumber(),
    longDistanceRate: settings.longDistanceRate.toNumber(),
    longDistanceThresholdKm: settings.longDistanceThresholdKm,
    dieselPricePerLiter: settings.dieselPricePerLiter.toNumber(),
    fuelFloor: settings.fuelFloor.toNumber(),
    fuelEfficiencyKmpl: settings.fuelEfficiencyKmpl.toNumber(),
    additionalHelperRate: settings.additionalHelperRate.toNumber(),
    additionalHourRate: settings.additionalHourRate.toNumber(),
    additionalDropoffCharge: settings.additionalDropoffCharge.toNumber(),
    standardIncludedHours: settings.standardIncludedHours,
    condoHandlingFee: settings.condoHandlingFee.toNumber(),
    cateringHandlingFee: settings.cateringHandlingFee.toNumber(),
    loadingUnloadingFee: settings.loadingUnloadingFee.toNumber(),
    distanceRatePerKm: settings.distanceRatePerKm.toNumber(),
    vatRate: settings.vatRate.toNumber(),
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

  return (
    <QuoteBuilderForm
      clients={clients}
      truckTypes={truckTypesForClient}
      routeAreas={routeAreas}
      settings={settingsForClient}
      initial={initial}
    />
  );
}
