import { db } from "@/lib/db";
import Link from "next/link";
import { QuoteBuilderForm } from "@/components/quotes/QuoteBuilderForm";
import { PageHeader } from "@/components/layout/PageHeader";

interface Props {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewQuotePage({ searchParams }: Props) {
  const { clientId } = await searchParams;
  const [clients, truckTypes, settings] = await Promise.all([
    db.client.findMany({
      where: { isActive: true },
      orderBy: { clientName: "asc" },
      select: { id: true, clientName: true, contactPerson: true },
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
    db.rateSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);

  if (clients.length === 0) {
    return (
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="New Quote" subtitle="Add a client first" />
        <div className="j-empty" style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10 }}>
          No active clients yet — every quotation needs a client profile.
          <small>
            <Link href="/clients">Go to Clients → add the first one</Link>
          </small>
        </div>
      </div>
    );
  }

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
      settings={settingsForClient}
      defaultClientId={clientId}
    />
  );
}
