import { db } from "@/lib/db";
import { BookingListClient } from "@/components/bookings/BookingListClient";

export default async function BookingsPage() {
  const bookings = await db.booking.findMany({
    orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { companyName: true } },
      truck: { select: { code: true, plateNo: true } },
      driver: { select: { fullName: true } },
      quote: { select: { quoteNo: true } },
    },
  });

  const trucks = await db.truck.findMany({
    where: { status: "ACTIVE" },
    orderBy: { code: "asc" },
    select: { id: true, code: true, plateNo: true },
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    bookingNo: b.bookingNo,
    status: b.status,
    scheduledDate: b.scheduledDate.toISOString(),
    clientName: b.client?.companyName ?? b.walkInName ?? "Walk-in",
    pickup: b.pickupPoint,
    dropoff: b.dropoffPoint,
    truckCode: b.truck?.code ?? null,
    truckPlate: b.truck?.plateNo ?? null,
    driverName: b.driver?.fullName ?? null,
    quoteNo: b.quote?.quoteNo ?? null,
    quotedAmount: b.quotedAmount.toNumber(),
  }));

  const trucksForFilter = trucks.map((t) => ({
    id: t.id,
    label: `${t.code} — ${t.plateNo}`,
  }));

  return <BookingListClient bookings={serialized} trucks={trucksForFilter} />;
}
