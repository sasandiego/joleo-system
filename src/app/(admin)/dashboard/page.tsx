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
    truckStatusCounts,
    quotesThisMonth,
    revenueThisMonth,
    todayBookings,
    recentQuotes,
  ] = await Promise.all([
    db.booking.count({ where: { status: { in: ["CONFIRMED", "DISPATCHED", "QUOTED"] } } }),
    db.truck.groupBy({ by: ["status"], _count: { _all: true } }),
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
    db.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        client: { select: { companyName: true } },
      },
    }),
  ]);

  const fleetByStatus: Record<"ACTIVE" | "UNDER_REPAIR" | "INACTIVE", number> = {
    ACTIVE: 0,
    UNDER_REPAIR: 0,
    INACTIVE: 0,
  };
  for (const row of truckStatusCounts) {
    fleetByStatus[row.status as keyof typeof fleetByStatus] = row._count._all;
  }
  const activeTrucks = fleetByStatus.ACTIVE;
  const totalTrucks = fleetByStatus.ACTIVE + fleetByStatus.UNDER_REPAIR + fleetByStatus.INACTIVE;

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
      <PageHeader title="Dashboard" subtitle={todayLabel}>
        <Link
          href="/quotes/new"
          data-btn
          style={{
            background: "var(--maroon)",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          + New Quote
        </Link>
      </PageHeader>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Bookings", value: String(activeBookings), unit: null },
          { label: "Fleet Active", value: String(activeTrucks), unit: `/ ${totalTrucks}` },
          { label: "Quotes This Month", value: String(quotesThisMonth), unit: null },
          {
            label: "Revenue MTD",
            value: revenueMTD > 0
              ? (revenueMTD / 1000).toFixed(1)
              : "0",
            unit: revenueMTD > 0 ? "₱k" : "₱",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            data-stat-card
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "22px 22px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Index numeral — small editorial flourish, top-right */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--muted)",
                opacity: 0.55,
                letterSpacing: "0.06em",
              }}
            >
              0{i + 1}
            </div>

            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              {stat.label}
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 46,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "var(--ink)",
                }}
              >
                {stat.value}
              </span>
              {stat.unit && (
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 400,
                    color: "var(--muted)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {stat.unit}
                </span>
              )}
            </div>

            {/* Maroon edge strip — thicker at top, fading to nothing */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 3,
                background:
                  "linear-gradient(90deg, var(--maroon) 0%, var(--maroon) 40px, transparent 100%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Two-column split: Today's Schedule (left) | Fleet Status + Recent Quotes (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>

      {/* Today's schedule */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
              Today&apos;s Schedule
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {todayBookings.length === 0
                ? "Nothing scheduled"
                : `${todayBookings.length} dispatch${todayBookings.length === 1 ? "" : "es"} scheduled`}
            </div>
          </div>
          <Link
            href="/bookings"
            style={{ fontSize: 12, color: "var(--maroon)", textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="j-empty">
            The road is quiet today.
            <small>
              <Link href="/quotes/new">Create a quote →</Link>
            </small>
          </div>
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
                      <span className="j-status" style={{ background: ss.bg, color: ss.color }}>
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

      {/* Right column: Fleet Status + Recent Quotes stacked */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Fleet Status */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>Fleet Status</div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Active", count: fleetByStatus.ACTIVE, badge: { bg: "#E8F5EC", color: "var(--success)" } },
              { label: "Under Repair", count: fleetByStatus.UNDER_REPAIR, badge: { bg: "#FCF4E0", color: "var(--warning)" } },
              { label: "Inactive", count: fleetByStatus.INACTIVE, badge: { bg: "#F0EFEC", color: "var(--ink-soft)" } },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>{row.label}</span>
                <span style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  background: row.badge.bg,
                  color: row.badge.color,
                }}>
                  {row.count} truck{row.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>Recent Quotes</div>
            <Link href="/quotes" style={{ fontSize: 12, color: "var(--maroon)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: "4px 20px 12px" }}>
            {recentQuotes.length === 0 ? (
              <div className="j-empty" style={{ padding: "28px 8px" }}>
                Nothing quoted yet.
              </div>
            ) : (
              recentQuotes.map((q, i) => {
                const clientName = q.client?.companyName ?? q.walkInName ?? "Walk-in";
                const pickup = q.pickupPoint.split(",")[0];
                const dropoff = q.dropoffPoint.split(",")[0];
                return (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    style={{
                      display: "block",
                      padding: "12px 0",
                      borderBottom: i === recentQuotes.length - 1 ? "none" : "1px solid var(--border)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                      {q.quoteNo}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0" }}>
                      {clientName} · {pickup} → {dropoff}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--maroon)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      ₱{q.finalPrice.toNumber().toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
