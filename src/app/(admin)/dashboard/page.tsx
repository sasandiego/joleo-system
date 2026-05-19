import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";

const TIMEZONE = "Asia/Manila";

export default async function DashboardPage() {
  const nowManila = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date()) + "T00:00:00.000Z"
  );
  const todayStart = new Date(nowManila);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(nowManila);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart);
  monthStart.setUTCDate(1);

  const [
    activeBookings,
    activeTrucks,
    totalTrucks,
    quotesThisMonth,
    revenueThisMonth,
    todayBookings,
  ] = await Promise.all([
    db.booking.count({ where: { status: { in: ["CONFIRMED", "DISPATCHED", "QUOTED"] } } }),
    db.truck.count({ where: { status: "ACTIVE" } }),
    db.truck.count(),
    db.quote.count({ where: { createdAt: { gte: monthStart } } }),
    db.booking.aggregate({
      _sum: { quotedAmount: true },
      where: {
        status: { in: ["CONFIRMED", "DISPATCHED", "COMPLETED"] },
        scheduledDate: { gte: monthStart },
      },
    }),
    db.booking.findMany({
      where: {
        scheduledDate: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: { scheduledDate: "asc" },
      include: {
        client: { select: { companyName: true } },
        truck: { select: { code: true } },
        driver: { select: { fullName: true } },
      },
    }),
  ]);

  const revenueMTD = revenueThisMonth._sum.quotedAmount?.toNumber() ?? 0;

  const todayLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: "var(--bg)", color: "var(--muted)" },
    QUOTED: { bg: "#fffbeb", color: "#92400e" },
    CONFIRMED: { bg: "var(--maroon-tint)", color: "var(--maroon)" },
    DISPATCHED: { bg: "#1a1a2e", color: "#e2e8f0" },
    COMPLETED: { bg: "#f0fdf4", color: "#166534" },
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={todayLabel} />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Bookings", value: String(activeBookings) },
          { label: "Fleet Active", value: `${activeTrucks} / ${totalTrucks}` },
          { label: "Quotes This Month", value: String(quotesThisMonth) },
          {
            label: "Revenue MTD",
            value: revenueMTD > 0
              ? `₱${(revenueMTD / 1000).toFixed(1)}k`
              : "₱0",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", fontWeight: 600 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, marginTop: 8, letterSpacing: "-0.02em" }}>
              {stat.value}
            </div>
            <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%", background: "var(--maroon)", opacity: 0.6 }} />
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
            Today&apos;s Schedule
          </div>
          <Link
            href="/bookings"
            style={{ fontSize: 12, color: "var(--maroon)", textDecoration: "none" }}
          >
            View all bookings →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            No bookings scheduled for today.{" "}
            <Link href="/quotes/new" style={{ color: "var(--maroon)", textDecoration: "none" }}>
              Create a quote →
            </Link>
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Booking", "Client", "Route", "Truck / Driver", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((b) => {
                const ss = STATUS_STYLES[b.status] ?? STATUS_STYLES.DRAFT;
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
                      <Link href={`/bookings/${b.id}`} style={{ color: "var(--maroon)", textDecoration: "none" }}>
                        {b.bookingNo}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 12px 10px 0" }}>
                      {b.client?.companyName ?? b.walkInName ?? "Walk-in"}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", fontSize: 12, color: "var(--muted)" }}>
                      {b.pickupPoint.split(",")[0]} → {b.dropoffPoint.split(",")[0]}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", fontSize: 12 }}>
                      {b.truck ? (
                        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                          {b.truck.code}
                        </span>
                      ) : "—"}
                      {b.driver && (
                        <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                          {b.driver.fullName.split(",")[0]}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
