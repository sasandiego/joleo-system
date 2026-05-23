"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";

interface BookingSummary {
  id: string;
  bookingNo: string;
  status: string;
  scheduledDate: string;
  scheduledStartTime: string | null;
  clientName: string;
  pickup: string;
  dropoff: string;
  truckCode: string | null;
  truckPlate: string | null;
  driverName: string | null;
  quoteNo: string | null;
  quotedAmount: number;
}

interface TruckOption {
  id: string;
  label: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT: { bg: "var(--bg)", color: "var(--muted)", border: "var(--border)" },
  QUOTED: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  CONFIRMED: { bg: "var(--maroon-tint)", color: "var(--maroon)", border: "var(--maroon)" },
  DISPATCHED: { bg: "#1a1a2e", color: "#e2e8f0", border: "#1a1a2e" },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export function BookingListClient({
  bookings,
}: {
  bookings: BookingSummary[];
  trucks: TruckOption[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [truckFilter, setTruckFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (
        search &&
        !b.bookingNo.toLowerCase().includes(search.toLowerCase()) &&
        !b.clientName.toLowerCase().includes(search.toLowerCase()) &&
        !(b.truckCode?.toLowerCase().includes(search.toLowerCase())) &&
        !(b.truckPlate?.toLowerCase().includes(search.toLowerCase()))
      )
        return false;
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (truckFilter !== "ALL" && b.truckCode !== truckFilter) return false;
      if (dateFilter && b.scheduledDate.slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [bookings, search, statusFilter, truckFilter, dateFilter]);

  const activeCount = bookings.filter((b) =>
    ["CONFIRMED", "DISPATCHED", "QUOTED"].includes(b.status)
  ).length;

  return (
    <div>
      <PageHeader title="Bookings" subtitle={`${bookings.length} total · ${activeCount} active`}>
        <Link
          href="/bookings/new"
          style={{
            background: "var(--maroon)",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          + New Booking
        </Link>
      </PageHeader>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search by ID, client, plate no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "8px 10px 8px 30px",
              fontSize: 13,
              fontFamily: "inherit",
              background: "var(--bg)",
              color: "var(--fg)",
              outline: "none",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 28px 8px 10px",
            fontSize: 13,
            fontFamily: "inherit",
            background: "var(--bg)",
            color: "var(--fg)",
            outline: "none",
            cursor: "pointer",
            minWidth: 140,
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          <option value="ALL">All statuses</option>
          {["DRAFT", "QUOTED", "CONFIRMED", "DISPATCHED", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 13,
            fontFamily: "inherit",
            background: "var(--bg)",
            color: "var(--fg)",
            outline: "none",
          }}
        />
        {(search || statusFilter !== "ALL" || truckFilter !== "ALL" || dateFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTruckFilter("ALL");
              setDateFilter("");
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 12,
              color: "var(--muted)",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          {bookings.length === 0
            ? "No bookings yet. Create your first quote to get started."
            : "No bookings match your filters."}
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Booking ID", "Date", "Client", "Route", "Truck", "Amount", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      <Link
                        href={`/bookings/${b.id}`}
                        style={{ color: "var(--maroon)", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        {b.bookingNo}
                      </Link>
                    </div>
                    {b.quoteNo && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {b.quoteNo}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {formatDate(b.scheduledDate)}
                    {b.scheduledStartTime && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {(() => {
                          const [h, m] = b.scheduledStartTime!.split(":").map(Number);
                          const period = h >= 12 ? "PM" : "AM";
                          const hour12 = h % 12 || 12;
                          return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
                        })()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{b.clientName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>
                    {b.pickup.split(",")[0]} → {b.dropoff.split(",")[0]}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {b.truckCode ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          background: "var(--ink)",
                          color: "white",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {b.truckCode}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(b.quotedAmount)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link
                      href={`/bookings/${b.id}`}
                      style={{
                        color: "var(--maroon)",
                        fontSize: 12,
                        textDecoration: "none",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
