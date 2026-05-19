"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { transitionBookingAction, updateBookingAssignmentAction } from "@/actions/bookings";

interface BookingDetail {
  id: string;
  bookingNo: string;
  status: string;
  scheduledDate: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  clientName: string;
  contactPerson: string | null;
  pickup: string;
  dropoff: string;
  estimatedDistanceKm: number;
  truckId: string | null;
  truckLabel: string | null;
  driverId: string | null;
  driverName: string | null;
  helperIds: string[];
  helperNames: string[];
  quoteNo: string | null;
  quoteId: string | null;
  quotedAmount: number;
  finalAmount: number | null;
  notes: string | null;
  cancelReason: string | null;
  createdBy: string;
  createdAt: string;
}

interface SelectOption {
  id: string;
  code?: string;
  plateNo?: string;
  fullName?: string;
}

interface Props {
  booking: BookingDetail;
  trucks: SelectOption[];
  drivers: SelectOption[];
  helpers: SelectOption[];
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["QUOTED", "CANCELLED"],
  QUOTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT: { bg: "var(--bg)", color: "var(--muted)", border: "var(--border)" },
  QUOTED: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d" },
  CONFIRMED: { bg: "var(--maroon-tint)", color: "var(--maroon)", border: "var(--maroon)" },
  DISPATCHED: { bg: "#1a1a2e", color: "#e2e8f0", border: "#1a1a2e" },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "var(--bg)",
  color: "var(--fg)",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 28,
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--muted)",
        marginBottom: 6,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--maroon)",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function TransitionButton({ toStatus }: { toStatus: string; bookingId: string }) {
  const { pending } = useFormStatus();
  const isCancel = toStatus === "CANCELLED";
  return (
    <button
      type="submit"
      name="toStatus"
      value={toStatus}
      disabled={pending}
      style={{
        background: isCancel ? "transparent" : "var(--maroon)",
        color: isCancel ? "#dc2626" : "white",
        border: isCancel ? "1px solid #fca5a5" : "none",
        borderRadius: 6,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 500,
        cursor: pending ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Updating…" : `→ ${toStatus}`}
    </button>
  );
}

function AssignSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: pending ? "var(--maroon-tint)" : "var(--maroon)",
        color: pending ? "var(--maroon)" : "white",
        border: "none",
        borderRadius: 6,
        padding: "8px 20px",
        fontSize: 13,
        fontWeight: 500,
        cursor: pending ? "not-allowed" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {pending ? "Saving…" : "Save assignment"}
    </button>
  );
}

export function BookingDetailClient({ booking, trucks, drivers, helpers }: Props) {
  const [transitionState, transitionAction] = useActionState(transitionBookingAction, undefined);
  const [assignState, assignAction] = useActionState(updateBookingAssignmentAction, undefined);

  const [selectedHelpers, setSelectedHelpers] = useState<string[]>(booking.helperIds);
  const [showCancelNote, setShowCancelNote] = useState(false);

  const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.DRAFT;
  const allowedTransitions = STATUS_TRANSITIONS[booking.status] ?? [];
  const isEditable = !["COMPLETED", "CANCELLED"].includes(booking.status);

  function toggleHelper(id: string) {
    setSelectedHelpers((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <PageHeader
        title={booking.bookingNo}
        subtitle={`${formatDate(booking.scheduledDate)} · Created by ${booking.createdBy}`}
      >
        <Link
          href="/bookings"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--fg)",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
      </PageHeader>

      {transitionState?.error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            border: "1px solid #fca5a5",
          }}
        >
          {transitionState.error}
        </div>
      )}
      {assignState?.error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            border: "1px solid #fca5a5",
          }}
        >
          {assignState.error}
        </div>
      )}
      {assignState?.success && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#dcfce7",
            color: "#166534",
            fontSize: 13,
            border: "1px solid #86efac",
          }}
        >
          Assignment saved.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Left */}
        <div>
          {/* Booking info */}
          <Card title="Booking Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <DetailRow label="Client" value={booking.clientName} />
              {booking.contactPerson && <DetailRow label="Contact" value={booking.contactPerson} />}
              <DetailRow label="Pick-up" value={booking.pickup} />
              <DetailRow label="Drop-off" value={booking.dropoff} />
              <DetailRow label="Distance" value={`${booking.estimatedDistanceKm} km`} />
              <DetailRow label="Date" value={formatDate(booking.scheduledDate)} />
              {booking.scheduledStartTime && (
                <DetailRow label="Time" value={`${booking.scheduledStartTime}${booking.scheduledEndTime ? ` – ${booking.scheduledEndTime}` : ""}`} />
              )}
              {booking.quoteNo && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Quote</div>
                  <Link
                    href={`/quotes/${booking.quoteId}`}
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--maroon)", textDecoration: "none" }}
                  >
                    {booking.quoteNo}
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Assignment form */}
          {isEditable && (
            <form action={assignAction}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <Card title="Truck & Crew Assignment">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <FieldLabel>Truck</FieldLabel>
                    <select name="truckId" defaultValue={booking.truckId ?? ""} style={selectStyle}>
                      <option value="">— Unassigned —</option>
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} — {t.plateNo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Driver</FieldLabel>
                    <select name="driverId" defaultValue={booking.driverId ?? ""} style={selectStyle}>
                      <option value="">— Unassigned —</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Scheduled Date</FieldLabel>
                    <input
                      type="date"
                      name="scheduledDate"
                      defaultValue={booking.scheduledDate.slice(0, 10)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <FieldLabel>Start Time</FieldLabel>
                      <input
                        type="time"
                        name="scheduledStartTime"
                        defaultValue={booking.scheduledStartTime ?? ""}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <FieldLabel>End Time</FieldLabel>
                      <input
                        type="time"
                        name="scheduledEndTime"
                        defaultValue={booking.scheduledEndTime ?? ""}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Helpers</FieldLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {helpers.map((h) => {
                        const selected = selectedHelpers.includes(h.id);
                        return (
                          <label
                            key={h.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 10px",
                              borderRadius: 20,
                              border: "1px solid",
                              borderColor: selected ? "var(--maroon)" : "var(--border)",
                              background: selected ? "var(--maroon-tint)" : "transparent",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 500,
                              color: selected ? "var(--maroon)" : "var(--fg)",
                            }}
                          >
                            <input
                              type="checkbox"
                              name="helperId"
                              value={h.id}
                              checked={selected}
                              onChange={() => toggleHelper(h.id)}
                              style={{ display: "none" }}
                            />
                            {h.fullName}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      name="notes"
                      defaultValue={booking.notes ?? ""}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <AssignSaveButton />
                </div>
              </Card>
            </form>
          )}

          {/* Cancel reason (if cancelled) */}
          {booking.status === "CANCELLED" && booking.cancelReason && (
            <Card title="Cancellation">
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{booking.cancelReason}</p>
            </Card>
          )}

          {/* View-only assignment (completed/cancelled) */}
          {!isEditable && (booking.truckLabel || booking.driverName || booking.helperNames.length > 0) && (
            <Card title="Truck & Crew">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {booking.truckLabel && <DetailRow label="Truck" value={booking.truckLabel} />}
                {booking.driverName && <DetailRow label="Driver" value={booking.driverName} />}
                {booking.helperNames.length > 0 && (
                  <DetailRow label="Helpers" value={booking.helperNames.join(", ")} />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: status panel */}
        <div style={{ position: "sticky", top: 72 }}>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--maroon)", marginBottom: 16 }}>
              Status
            </div>

            <div style={{ marginBottom: 20 }}>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {booking.status}
              </span>
            </div>

            {allowedTransitions.length > 0 && (
              <form action={transitionAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allowedTransitions
                    .filter((t) => t !== "CANCELLED")
                    .map((t) => (
                      <TransitionButton key={t} toStatus={t} bookingId={booking.id} />
                    ))}
                  {allowedTransitions.includes("CANCELLED") && (
                    <>
                      {!showCancelNote && (
                        <button
                          type="button"
                          onClick={() => setShowCancelNote(true)}
                          style={{
                            background: "transparent",
                            border: "1px solid #fca5a5",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            color: "#dc2626",
                            fontFamily: "inherit",
                          }}
                        >
                          → CANCELLED
                        </button>
                      )}
                      {showCancelNote && (
                        <div>
                          <textarea
                            name="cancelReason"
                            placeholder="Reason for cancellation (optional)"
                            style={{ ...inputStyle, resize: "vertical", minHeight: 64, marginBottom: 8 }}
                          />
                          <TransitionButton toStatus="CANCELLED" bookingId={booking.id} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </form>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--maroon)", marginBottom: 12 }}>
                Financials
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--muted)" }}>Quoted</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(booking.quotedAmount)}</span>
              </div>
              {booking.finalAmount !== null && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                  <span>Final</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--maroon)" }}>{formatCurrency(booking.finalAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
