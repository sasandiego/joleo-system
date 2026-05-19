"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRouter } from "next/navigation";

interface TruckRow {
  id: string;
  code: string;
  plateNo: string;
  status: string;
  sizeFt: number;
  wheelType: string;
}

interface CalBooking {
  id: string;
  bookingNo: string;
  status: string;
  scheduledDate: string;
  truckId: string;
  clientName: string;
  pickup: string;
  dropoff: string;
}

interface Props {
  trucks: TruckRow[];
  bookings: CalBooking[];
  days: string[]; // "yyyy-MM-dd" × 7
  weekLabel: string;
  prevWeek: string;
  nextWeek: string;
  thisWeek: string;
}

const BOOKING_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  CONFIRMED: { bg: "var(--maroon)", color: "white", border: "var(--maroon)" },
  DISPATCHED: { bg: "var(--ink)", color: "white", border: "var(--ink)" },
  DRAFT: { bg: "white", color: "var(--fg)", border: "var(--border-strong)" },
  QUOTED: { bg: "white", color: "var(--fg)", border: "var(--border-strong)" },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TruckCalendar({ trucks, bookings, days, weekLabel, prevWeek, nextWeek, thisWeek }: Props) {
  const router = useRouter();

  // Index bookings: truckId → dateStr → booking
  const index: Record<string, Record<string, CalBooking>> = {};
  for (const b of bookings) {
    const dateStr = b.scheduledDate.slice(0, 10);
    if (!index[b.truckId]) index[b.truckId] = {};
    index[b.truckId][dateStr] = b;
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  return (
    <div>
      <PageHeader title="Truck Availability" subtitle={weekLabel}>
        <button
          onClick={() => router.push(`/calendar?week=${prevWeek}`)}
          style={navBtnStyle}
        >
          ← Prev week
        </button>
        <button
          onClick={() => router.push(`/calendar?week=${thisWeek}`)}
          style={navBtnStyle}
        >
          This week
        </button>
        <button
          onClick={() => router.push(`/calendar?week=${nextWeek}`)}
          style={navBtnStyle}
        >
          Next week →
        </button>
      </PageHeader>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 12, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { label: "Confirmed", bg: "var(--maroon)", border: "var(--maroon)", dashed: false },
          { label: "Dispatched", bg: "var(--ink)", border: "var(--ink)", dashed: false },
          { label: "Draft / Pending", bg: "white", border: "var(--border-strong)", dashed: true },
          { label: "Unavailable", bg: "repeating-linear-gradient(45deg,#F0EFEC,#F0EFEC 3px,white 3px,white 6px)", border: "var(--border)", dashed: false },
        ].map(({ label, bg, border, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: bg,
                borderRadius: 3,
                border: `1px ${dashed ? "dashed" : "solid"} ${border}`,
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px repeat(7, 1fr)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--card)",
        }}
      >
        {/* Header row */}
        <div style={headerCellStyle} />
        {days.map((day, i) => {
          const isToday = day === today;
          const num = day.slice(8);
          return (
            <div
              key={day}
              style={{
                ...headerCellStyle,
                borderLeft: "1px solid var(--border)",
                background: isToday ? "var(--maroon-tint)" : undefined,
                color: isToday ? "var(--maroon)" : undefined,
                textAlign: "center",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {DAY_LABELS[i]}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isToday ? "var(--maroon)" : "var(--ink)",
                }}
              >
                {num}
              </span>
            </div>
          );
        })}

        {/* Truck rows */}
        {trucks.map((truck, ti) => {
          const isUnavailable = truck.status !== "ACTIVE";
          const rowBg = ti % 2 === 0 ? "transparent" : "var(--surface)";

          return (
            <>
              {/* Truck label cell */}
              <div
                key={`label-${truck.id}`}
                style={{
                  padding: "10px 14px",
                  borderTop: "1px solid var(--border)",
                  background: rowBg,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  {truck.code} · {truck.plateNo}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                  {truck.sizeFt}ftr · {truck.wheelType}
                </div>
                {isUnavailable && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#dc2626",
                    }}
                  >
                    {truck.status.replace("_", " ")}
                  </div>
                )}
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const booking = index[truck.id]?.[day];
                const cellStyle: React.CSSProperties = {
                  borderTop: "1px solid var(--border)",
                  borderLeft: "1px solid var(--border)",
                  padding: 4,
                  minHeight: 60,
                  background: isUnavailable
                    ? "repeating-linear-gradient(45deg,#F0EFEC,#F0EFEC 3px,white 3px,white 6px)"
                    : rowBg,
                };

                return (
                  <div key={`${truck.id}-${day}`} style={cellStyle}>
                    {booking && !isUnavailable && (() => {
                      const style = BOOKING_COLORS[booking.status] ?? BOOKING_COLORS.DRAFT;
                      const isDashed = booking.status === "DRAFT" || booking.status === "QUOTED";
                      const shortClient = booking.clientName.split(" ")[0];
                      const shortPickup = booking.pickup.split(",")[0].slice(0, 6);
                      const shortDropoff = booking.dropoff.split(",")[0].slice(0, 6);
                      return (
                        <Link
                          href={`/bookings/${booking.id}`}
                          style={{
                            display: "block",
                            padding: "4px 6px",
                            borderRadius: 4,
                            background: style.bg,
                            color: style.color,
                            border: `1px ${isDashed ? "dashed" : "solid"} ${style.border}`,
                            fontSize: 10,
                            lineHeight: 1.4,
                            textDecoration: "none",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {shortClient}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: 9 }}>
                            {shortPickup}→{shortDropoff}
                          </div>
                        </Link>
                      );
                    })()}
                  </div>
                );
              })}
            </>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
        Click any booking block to view details. Trucks marked as Under Repair or Inactive appear with diagonal stripes.
      </p>
    </div>
  );
}

const headerCellStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "var(--paper)",
  fontWeight: 600,
  fontSize: 12,
  color: "var(--muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const navBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  color: "var(--fg)",
};
