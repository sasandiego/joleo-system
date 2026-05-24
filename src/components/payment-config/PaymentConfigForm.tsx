"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePaymentConfigAction } from "@/actions/payment-config";
import { PageHeader } from "@/components/layout/PageHeader";

interface Config {
  bank1Name:    string;
  bank1Holder:  string;
  bank1Account: string;
  bank2Name:    string;
  bank2Holder:  string;
  bank2Account: string;
  gcashHolder:  string;
  gcashNumber:  string;
  updatedAt:    string;
}

interface Props { initial: Config; }

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-btn
      style={{
        background: "var(--maroon)",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "9px 20px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  background: "white",
  color: "var(--ink)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input name={name} defaultValue={defaultValue} style={inputStyle} required />
    </div>
  );
}

function MethodCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px 24px",
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
          paddingBottom: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

export function PaymentConfigForm({ initial }: Props) {
  const [state, action] = useActionState(updatePaymentConfigAction, undefined);
  const updatedAt = new Date(initial.updatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  return (
    <div>
      <PageHeader
        title="Payment Details"
        subtitle="Bank accounts and GCash number shown on all PDF quotations"
      />

      <form action={action}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>

          <MethodCard title="Bank Account 1">
            <Field label="Bank Name"       name="bank1Name"    defaultValue={initial.bank1Name} />
            <Field label="Account Holder"  name="bank1Holder"  defaultValue={initial.bank1Holder} />
            <Field label="Account Number"  name="bank1Account" defaultValue={initial.bank1Account} />
          </MethodCard>

          <MethodCard title="Bank Account 2">
            <Field label="Bank Name"       name="bank2Name"    defaultValue={initial.bank2Name} />
            <Field label="Account Holder"  name="bank2Holder"  defaultValue={initial.bank2Holder} />
            <Field label="Account Number"  name="bank2Account" defaultValue={initial.bank2Account} />
          </MethodCard>

          <MethodCard title="GCash">
            <Field label="Account Name"  name="gcashHolder" defaultValue={initial.gcashHolder} />
            <Field label="Mobile Number" name="gcashNumber" defaultValue={initial.gcashNumber} />
          </MethodCard>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Last updated: {updatedAt}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {state?.error && (
                <span style={{ fontSize: 13, color: "var(--danger)" }}>{state.error}</span>
              )}
              {state?.success && (
                <span style={{ fontSize: 13, color: "var(--success)" }}>Saved.</span>
              )}
              <SaveButton />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
