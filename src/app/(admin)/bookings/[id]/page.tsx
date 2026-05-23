import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookingDetailClient } from "@/components/bookings/BookingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;

  const [booking, trucks, drivers, helpers, rateSettings, priceHistory] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        client: { select: { clientName: true, contactPerson: true } },
        truck: { select: { id: true, code: true, plateNo: true } },
        driver: { select: { id: true, fullName: true } },
        helpers: { include: { helper: { select: { id: true, fullName: true } } } },
        quote: {
          select: {
            quoteNo: true,
            id: true,
            truckTypeId: true,
            estimatedHours: true,
            numberOfDropoffs: true,
            condoService: true,
            cateringService: true,
            additionalHelper: true,
            tollFee: true,
            discountAmount: true,
            manualOverridePrice: true,
            vatOption: true,
          },
        },
        createdBy: { select: { username: true } },
      },
    }),
    db.truck.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        plateNo: true,
        truckTypeId: true,
        truckType: { select: { label: true, eightHourBaseRate: true, perTripBaseRate: true } },
      },
    }),
    db.driver.findMany({
      where: { status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    db.helper.findMany({
      where: { status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    db.rateSettings.findFirst(),
    db.auditLog.findMany({
      where: { entityId: id, action: "BOOKING_PRICE_UPDATED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, before: true, after: true },
    }),
  ]);

  if (!booking) notFound();

  const serialized = {
    id: booking.id,
    bookingNo: booking.bookingNo,
    status: booking.status,
    scheduledDate: booking.scheduledDate.toISOString(),
    scheduledStartTime: booking.scheduledStartTime,
    scheduledEndTime: booking.scheduledEndTime,
    clientName: booking.client?.clientName ?? booking.walkInName ?? "Walk-in",
    contactPerson: booking.client?.contactPerson ?? null,
    pickup: booking.pickupPoint,
    dropoff: booking.dropoffPoint,
    estimatedDistanceKm: booking.estimatedDistanceKm,
    tripBillingType: booking.tripBillingType,
    truckId: booking.truck?.id ?? null,
    truckLabel: booking.truck ? `${booking.truck.code} — ${booking.truck.plateNo}` : null,
    driverId: booking.driver?.id ?? null,
    driverName: booking.driver?.fullName ?? null,
    helperIds: booking.helpers.map((bh) => bh.helperId),
    helperNames: booking.helpers.map((bh) => bh.helper.fullName),
    quoteNo: booking.quote?.quoteNo ?? null,
    quoteId: booking.quote?.id ?? null,
    estimatedHours: booking.quote?.estimatedHours ?? null,
    quotedTruckTypeId: booking.quote?.truckTypeId ?? null,
    quotedTruckTypeLabel: booking.quote?.truckTypeId
      ? (trucks.find((t) => t.truckTypeId === booking.quote!.truckTypeId)?.truckType.label ?? null)
      : null,
    quotedAmount: booking.quotedAmount.toNumber(),
    finalAmount: booking.finalAmount?.toNumber() ?? null,
    notes: booking.notes,
    cancelReason: booking.cancelReason,
    createdBy: booking.createdBy.username,
    createdAt: booking.createdAt.toISOString(),
    quoteParams: booking.quote
      ? {
          numberOfDropoffs: booking.quote.numberOfDropoffs,
          condoService: booking.quote.condoService,
          cateringService: booking.quote.cateringService,
          additionalHelper: booking.quote.additionalHelper,
          tollFee: booking.quote.tollFee.toNumber(),
          discountAmount: booking.quote.discountAmount.toNumber(),
          vatOption: booking.quote.vatOption as "VAT_INCLUSIVE" | "VAT_EXCLUSIVE" | "NON_VAT",
        }
      : null,
  };

  const trucksForAssignment = trucks.map((t) => ({
    id: t.id,
    code: t.code,
    plateNo: t.plateNo,
    truckTypeId: t.truckTypeId,
    truckTypeLabel: t.truckType.label,
    eightHourBaseRate: t.truckType.eightHourBaseRate.toNumber(),
    perTripBaseRate: t.truckType.perTripBaseRate.toNumber(),
  }));

  const serializedRateSettings = rateSettings
    ? {
        driverRate: rateSettings.driverRate.toNumber(),
        helperRate: rateSettings.helperRate.toNumber(),
        overheadRate: rateSettings.overheadRate.toNumber(),
        longDistanceRate: rateSettings.longDistanceRate.toNumber(),
        longDistanceThresholdKm: rateSettings.longDistanceThresholdKm,
        dieselPricePerLiter: rateSettings.dieselPricePerLiter.toNumber(),
        fuelFloor: rateSettings.fuelFloor.toNumber(),
        fuelEfficiencyKmpl: rateSettings.fuelEfficiencyKmpl.toNumber(),
        additionalHelperRate: rateSettings.additionalHelperRate.toNumber(),
        additionalHourRate: rateSettings.additionalHourRate.toNumber(),
        additionalDropoffCharge: rateSettings.additionalDropoffCharge.toNumber(),
        standardIncludedHours: rateSettings.standardIncludedHours,
        condoHandlingFee: rateSettings.condoHandlingFee.toNumber(),
        cateringHandlingFee: rateSettings.cateringHandlingFee.toNumber(),
        loadingUnloadingFee: rateSettings.loadingUnloadingFee.toNumber(),
        distanceRatePerKm: rateSettings.distanceRatePerKm.toNumber(),
        vatRate: rateSettings.vatRate.toNumber(),
      }
    : null;

  const serializedPriceHistory = priceHistory.map((entry) => {
    const before = entry.before as { quotedAmount: number; truckType: string | null };
    const after = entry.after as { quotedAmount: number; truckType: string | null; username?: string };
    return {
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      username: after.username ?? "—",
      oldAmount: before.quotedAmount,
      newAmount: after.quotedAmount,
      oldTruckType: before.truckType,
      newTruckType: after.truckType,
    };
  });

  return (
    <BookingDetailClient
      booking={serialized}
      trucks={trucksForAssignment}
      drivers={drivers}
      helpers={helpers}
      rateSettings={serializedRateSettings}
      priceHistory={serializedPriceHistory}
    />
  );
}
