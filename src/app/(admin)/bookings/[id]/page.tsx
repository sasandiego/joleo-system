import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookingDetailClient } from "@/components/bookings/BookingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;

  const [booking, trucks, drivers, helpers] = await Promise.all([
    db.booking.findUnique({
      where: { id },
      include: {
        client: { select: { companyName: true, contactPerson: true } },
        truck: { select: { id: true, code: true, plateNo: true } },
        driver: { select: { id: true, fullName: true } },
        helpers: { include: { helper: { select: { id: true, fullName: true } } } },
        quote: { select: { quoteNo: true, id: true } },
        createdBy: { select: { username: true } },
      },
    }),
    db.truck.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, plateNo: true },
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
  ]);

  if (!booking) notFound();

  const serialized = {
    id: booking.id,
    bookingNo: booking.bookingNo,
    status: booking.status,
    scheduledDate: booking.scheduledDate.toISOString(),
    scheduledStartTime: booking.scheduledStartTime,
    scheduledEndTime: booking.scheduledEndTime,
    clientName: booking.client?.companyName ?? booking.walkInName ?? "Walk-in",
    contactPerson: booking.client?.contactPerson ?? null,
    pickup: booking.pickupPoint,
    dropoff: booking.dropoffPoint,
    estimatedDistanceKm: booking.estimatedDistanceKm,
    truckId: booking.truck?.id ?? null,
    truckLabel: booking.truck ? `${booking.truck.code} — ${booking.truck.plateNo}` : null,
    driverId: booking.driver?.id ?? null,
    driverName: booking.driver?.fullName ?? null,
    helperIds: booking.helpers.map((bh) => bh.helperId),
    helperNames: booking.helpers.map((bh) => bh.helper.fullName),
    quoteNo: booking.quote?.quoteNo ?? null,
    quoteId: booking.quote?.id ?? null,
    quotedAmount: booking.quotedAmount.toNumber(),
    finalAmount: booking.finalAmount?.toNumber() ?? null,
    notes: booking.notes,
    cancelReason: booking.cancelReason,
    createdBy: booking.createdBy.username,
    createdAt: booking.createdAt.toISOString(),
  };

  return (
    <BookingDetailClient
      booking={serialized}
      trucks={trucks}
      drivers={drivers}
      helpers={helpers}
    />
  );
}
