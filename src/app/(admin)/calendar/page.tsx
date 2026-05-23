import { db } from "@/lib/db";
import { TruckCalendar } from "@/components/bookings/TruckCalendar";
import { formatInTimeZone } from "date-fns-tz";
import { startOfWeek, addDays } from "date-fns";

const TIMEZONE = "Asia/Manila";

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams;

  // Determine week start (Monday). Default = current week in Manila TZ.
  let weekStart: Date;
  if (week) {
    weekStart = new Date(week + "T00:00:00+08:00");
  } else {
    const nowManila = new Date(
      formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    );
    weekStart = startOfWeek(nowManila, { weekStartsOn: 1 });
  }
  const weekEnd = addDays(weekStart, 6);

  const [trucks, bookings] = await Promise.all([
    db.truck.findMany({
      orderBy: { code: "asc" },
      include: { truckType: { select: { sizeFt: true, wheelType: true } } },
    }),
    db.booking.findMany({
      where: {
        scheduledDate: { gte: weekStart, lte: weekEnd },
        status: { notIn: ["CANCELLED"] },
        truckId: { not: null },
      },
      select: {
        id: true,
        bookingNo: true,
        status: true,
        scheduledDate: true,
        truckId: true,
        pickupPoint: true,
        dropoffPoint: true,
        client: { select: { clientName: true } },
        walkInName: true,
      },
    }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const serializedTrucks = trucks.map((t) => ({
    id: t.id,
    code: t.code,
    plateNo: t.plateNo,
    status: t.status,
    sizeFt: t.truckType.sizeFt,
    wheelType: t.truckType.wheelType,
  }));

  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    bookingNo: b.bookingNo,
    status: b.status,
    scheduledDate: b.scheduledDate.toISOString(),
    truckId: b.truckId!,
    clientName: b.client?.clientName ?? b.walkInName ?? "Walk-in",
    pickup: b.pickupPoint,
    dropoff: b.dropoffPoint,
  }));

  const weekLabel = `Week of ${formatInTimeZone(weekStart, TIMEZONE, "MMM d")} – ${formatInTimeZone(weekEnd, TIMEZONE, "MMM d, yyyy")}`;
  const prevWeek = formatInTimeZone(addDays(weekStart, -7), TIMEZONE, "yyyy-MM-dd");
  const nextWeek = formatInTimeZone(addDays(weekStart, 7), TIMEZONE, "yyyy-MM-dd");
  const thisWeek = formatInTimeZone(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    TIMEZONE,
    "yyyy-MM-dd"
  );

  return (
    <TruckCalendar
      trucks={serializedTrucks}
      bookings={serializedBookings}
      days={days.map((d) => formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd"))}
      weekLabel={weekLabel}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      thisWeek={thisWeek}
    />
  );
}
