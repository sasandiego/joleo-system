"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCompanyProfileAction } from "@/actions/company-profile";
import { PageHeader } from "@/components/layout/PageHeader";

interface Profile {
  phone:   string;
  mobile:  string;
  email:   string;
  address: string;
}

interface Props { initial: Profile; }

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

function Field({ label, name, defaultValue, type = "text" }: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input name={name} defaultValue={defaultValue} type={type} style={inputStyle} required />
    </div>
  );
}

export function CompanyProfileForm({ initial }: Props) {
  const [state, action] = useActionState(updateCompanyProfileAction, undefined);

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle="Joleo Transport contact details shown in client email notifications"
      />

      <form action={action}>
        <div
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 24px",
            maxWidth: 700,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--maroon)",
              paddingBottom: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            Contact Information
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Landline" name="phone"  defaultValue={initial.phone} />
            <Field label="Mobile"   name="mobile" defaultValue={initial.mobile} />
          </div>
          <Field label="Email"   name="email"   defaultValue={initial.email}   type="email" />
          <Field label="Address" name="address" defaultValue={initial.address} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 4 }}>
            {state?.error && (
              <span style={{ fontSize: 13, color: "var(--danger)" }}>{state.error}</span>
            )}
            {state?.success && (
              <span style={{ fontSize: 13, color: "var(--success)" }}>Saved.</span>
            )}
            <SaveButton />
          </div>
        </div>
      </form>
    </div>
  );
}
