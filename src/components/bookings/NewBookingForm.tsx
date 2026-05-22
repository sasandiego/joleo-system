"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { createBookingAction } from "@/actions/bookings";
import { useEffect } from "react";

interface Props {
  clients: { id: string; companyName: string }[];
  trucks: { id: string; code: string; plateNo: string }[];
  drivers: { id: string; fullName: string }[];
}

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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitButton() {
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
      {pending ? "Creating…" : "Create Booking"}
    </button>
  );
}

export function NewBookingForm({ clients, trucks, drivers }: Props) {
  const router = useRouter();
  const [state, action] = useActionState(createBookingAction, undefined);

  useEffect(() => {
    if (state?.success && state.bookingId) {
      router.push(`/bookings/${state.bookingId}`);
    }
  }, [state, router]);

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="New Booking" subtitle="Create a standalone booking">
        <Link href="/bookings" style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 16px", fontSize: 13, color: "var(--fg)", textDecoration: "none" }}>
          Cancel
        </Link>
      </PageHeader>

      {state?.error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", fontSize: 13, border: "1px solid #fca5a5" }}>
          {state.error}
        </div>
      )}

      <form action={action}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FieldGroup label="Client">
              <select name="clientId" style={selectStyle} required defaultValue="">
                <option value="" disabled>— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Pick-up Point">
              <input name="pickupPoint" type="text" style={inputStyle} required placeholder="e.g. Caloocan City" />
            </FieldGroup>
            <FieldGroup label="Drop-off Point">
              <input name="dropoffPoint" type="text" style={inputStyle} required placeholder="e.g. Pampanga" />
            </FieldGroup>
            <FieldGroup label="Estimated Distance (km)">
              <input name="estimatedDistanceKm" type="number" style={inputStyle} min={1} defaultValue={50} required />
            </FieldGroup>
            <FieldGroup label="Billing Type">
              <select name="tripBillingType" style={selectStyle} defaultValue="EIGHT_HOUR">
                <option value="EIGHT_HOUR">8 Hours (local / short trips)</option>
                <option value="PER_TRIP">Per Trip (long-distance flat rate)</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Scheduled Date">
              <input name="scheduledDate" type="date" style={inputStyle} required />
            </FieldGroup>
            <FieldGroup label="Truck">
              <select name="truckId" style={selectStyle}>
                <option value="">— Unassigned —</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{t.code} — {t.plateNo}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Driver">
              <select name="driverId" style={selectStyle}>
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Quoted Amount (₱)">
              <input name="quotedAmount" type="number" style={inputStyle} min={0} step="0.01" defaultValue={0} required />
            </FieldGroup>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Notes">
                <textarea name="notes" style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} />
              </FieldGroup>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <SubmitButton />
          </div>
        </div>
      </form>
    </div>
  );
}
