"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertClientAction } from "@/actions/clients";

type ClientType = "INDIVIDUAL_PERSON" | "INDIVIDUAL_BUSINESS" | "CORPORATION_BUSINESS";

interface ClientDialogProps {
  mode: "add" | "edit";
  client?: {
    id: string;
    clientCode: string | null;
    clientName: string;
    type: ClientType;
    contactPerson: string | null;
    mobile: string | null;
    landline: string | null;
    email: string | null;
    tin: string | null;
    address: string | null;
    paymentTerms: string | null;
    notes: string | null;
    isActive: boolean;
  };
}

function SubmitButtonWithLabel({ mode }: { mode: "add" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: pending ? "var(--maroon-tint)" : "var(--maroon)",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        padding: "9px 16px",
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Saving…" : mode === "add" ? "Add Client" : "Save Changes"}
    </button>
  );
}

const PAYMENT_TERMS = ["COD", "1 WEEK", "2 WEEKS", "30 DAYS", "45 DAYS"];

// Strip everything except digits, +, -, space, parens — silently as the user types.
// User can't type "abc" or "@" into a phone field; the keystroke just produces nothing.
function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+\-\s()]/g, "");
}

// Email shouldn't contain whitespace — strip it on the fly.
function sanitizeEmail(input: string): string {
  return input.replace(/\s/g, "");
}

// On blur, normalize PH mobile to a canonical format:
//   11-digit local (09xxxxxxxxx)  → 0917-123-4567
//   12-digit intl (639xxxxxxxxx)  → +63 917 123 4567
//   10-digit (9xxxxxxxxx)          → 0917-123-4567 (assumes missing leading 0)
// If the input doesn't match a known shape, leave it untouched so the regex error fires on submit.
function formatMobileOnBlur(input: string): string {
  if (!input.trim()) return "";
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("09")) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 12 && digits.startsWith("63")) {
    const rest = digits.slice(2);
    return `+63 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    return `0${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return input.trim();
}

// On blur for landline: just trim and collapse repeated whitespace.
// PH landline formats vary (provincial vs Metro Manila), so we don't impose a canonical shape.
function formatLandlineOnBlur(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function ClientDialog({ mode, client }: ClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(upsertClientAction, undefined);
  const [type, setType] = useState<ClientType>(client?.type ?? "INDIVIDUAL_BUSINESS");
  const [clientName, setClientName] = useState(client?.clientName ?? "");
  const [contactPerson, setContactPerson] = useState(client?.contactPerson ?? "");
  const [mobile, setMobile] = useState(client?.mobile ?? "");
  const [landline, setLandline] = useState(client?.landline ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [tin, setTin] = useState(client?.tin ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [paymentTerms, setPaymentTerms] = useState(client?.paymentTerms ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  // Re-sync state when the dialog opens — for Add this resets to empty,
  // for Edit it refreshes to the latest client data (in case it changed post-save).
  useEffect(() => {
    if (open) {
      setType(client?.type ?? "INDIVIDUAL_BUSINESS");
      setClientName(client?.clientName ?? "");
      setContactPerson(client?.contactPerson ?? "");
      setMobile(client?.mobile ?? "");
      setLandline(client?.landline ?? "");
      setEmail(client?.email ?? "");
      setTin(client?.tin ?? "");
      setAddress(client?.address ?? "");
      setPaymentTerms(client?.paymentTerms ?? "");
      setNotes(client?.notes ?? "");
    }
  }, [open, client?.id]);
  const isPerson = type === "INDIVIDUAL_PERSON";
  const isBusiness = type === "INDIVIDUAL_BUSINESS" || type === "CORPORATION_BUSINESS";

  const nameLabel =
    type === "INDIVIDUAL_PERSON" ? "Full Name *"
    : type === "INDIVIDUAL_BUSINESS" ? "Trade Name *"
    : "Company Name *";

  const namePlaceholder =
    type === "INDIVIDUAL_PERSON" ? "e.g. Juan Dela Cruz"
    : type === "INDIVIDUAL_BUSINESS" ? "e.g. DESKARTE DESIGN"
    : "e.g. Rebisco Manufacturing Corp.";

  const addressLabel =
    type === "INDIVIDUAL_PERSON" ? "Address"
    : type === "INDIVIDUAL_BUSINESS" ? "Business Address"
    : "Registered Address";

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 13.5,
    padding: "9px 12px",
    border: "1px solid var(--border-strong)",
    borderRadius: 6,
    background: "white",
    color: "var(--ink)",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-soft)",
    letterSpacing: "0.01em",
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <Dialog.Trigger asChild>
        {mode === "add" ? (
          <button
            style={{
              background: "var(--maroon)",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              padding: "9px 16px",
              cursor: "pointer",
            }}
          >
            » Add Client
          </button>
        ) : (
          <button
            style={{
              background: "transparent",
              color: "var(--ink-soft)",
              border: "none",
              padding: "6px 12px",
              fontSize: 12,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "white",
            borderRadius: 10,
            border: "1px solid var(--border)",
            padding: 32,
            width: 580,
            maxHeight: "90vh",
            overflowY: "auto",
            zIndex: 51,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <Dialog.Title
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: 24,
            }}
          >
            {mode === "add" ? "Add Client" : "Edit Client"}
          </Dialog.Title>

          {state?.success ? (
            <div>
              <div
                style={{
                  background: "#E8F5EC",
                  border: "1px solid #C5E4CF",
                  color: "var(--success)",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Client saved successfully.
              </div>
              <Dialog.Close asChild>
                <button
                  style={{
                    background: "white",
                    color: "var(--ink)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "9px 16px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <form action={formAction}>
              {mode === "edit" && client && (
                <input type="hidden" name="id" value={client.id} />
              )}

              {state?.error && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--danger)",
                    background: "#FBEAE7",
                    border: "1px solid #F5C2BC",
                    borderRadius: 6,
                    padding: "8px 12px",
                    marginBottom: 16,
                  }}
                >
                  {state.error}
                </div>
              )}

              <input type="hidden" name="type" value={type} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px 20px",
                }}
              >
                {/* Type — three-way segmented toggle, full width, first decision */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={labelStyle}>Type *</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <TypeBtn
                      label="Individual Person"
                      sub="One-off, no business"
                      active={type === "INDIVIDUAL_PERSON"}
                      onClick={() => setType("INDIVIDUAL_PERSON")}
                    />
                    <TypeBtn
                      label="Individual Business"
                      sub="Sole prop · DTI registered"
                      active={type === "INDIVIDUAL_BUSINESS"}
                      onClick={() => setType("INDIVIDUAL_BUSINESS")}
                    />
                    <TypeBtn
                      label="Corporation"
                      sub="SEC registered company"
                      active={type === "CORPORATION_BUSINESS"}
                      onClick={() => setType("CORPORATION_BUSINESS")}
                    />
                  </div>
                </div>

                {/* Name — label changes based on type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={labelStyle}>{nameLabel}</label>
                  <input
                    name="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    placeholder={namePlaceholder}
                    style={inputStyle}
                  />
                </div>

                {/* Client Code (system-generated, read-only) + Payment Terms */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>Client Code</label>
                  <input
                    type="text"
                    value={client?.clientCode ?? ""}
                    readOnly
                    placeholder={mode === "add" ? "Auto-generated on save" : ""}
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-mono)",
                      background: "var(--surface)",
                      color: "var(--muted)",
                      cursor: "not-allowed",
                    }}
                    title="System-generated, not editable."
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>Payment Terms</label>
                  <input type="hidden" name="paymentTerms" value={paymentTerms} />
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={inputStyle}>
                    <option value="">— Select —</option>
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Contact Person — shown for ALL types (person in charge can differ) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={labelStyle}>
                    {isPerson ? "Contact Person" : isBusiness && type === "INDIVIDUAL_BUSINESS" ? "Proprietor / Contact Person" : "Contact Person"}
                  </label>
                  <input
                    name="contactPerson"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={
                      isPerson
                        ? "Optional. The person to talk to if different from the client."
                        : type === "INDIVIDUAL_BUSINESS"
                          ? "Proprietor or primary contact"
                          : "Primary contact at the company"
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Mobile + Landline */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>Mobile</label>
                  <input
                    name="mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(sanitizePhone(e.target.value))}
                    onBlur={(e) => setMobile(formatMobileOnBlur(e.target.value))}
                    placeholder="0917-123-4567"
                    title="PH mobile, e.g. 0917-123-4567 or +639171234567"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>Landline</label>
                  <input
                    name="landline"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={landline}
                    onChange={(e) => setLandline(sanitizePhone(e.target.value))}
                    onBlur={(e) => setLandline(formatLandlineOnBlur(e.target.value))}
                    placeholder="(02) 8123-4567"
                    title="Phone number — digits, spaces, dashes, plus, or parentheses (e.g. (02) 8123-4567 or 045-961-1234)"
                    style={inputStyle}
                  />
                </div>

                {/* Email — full width for Person; pairs with TIN for Business */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: isPerson ? "span 2" : undefined }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                    onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
                    placeholder="name@example.com"
                    title="Valid email address (e.g. juan@example.com)"
                    style={inputStyle}
                  />
                </div>

                {/* TIN — businesses only (sole prop + corp) */}
                {isBusiness && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>TIN</label>
                    <input
                      name="tin"
                      type="text"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      placeholder="000-000-000-0000"
                      style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                    />
                  </div>
                )}

                {/* Address — label adapts */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={labelStyle}>{addressLabel}</label>
                  <textarea
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City, Province ZIP"
                    style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                  />
                </div>

                {/* Notes — full width */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Dialog.Close asChild>
                  <button
                    type="button"
                    style={{
                      background: "white",
                      color: "var(--ink)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 6,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "9px 16px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <SubmitButtonWithLabel mode={mode} />
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TypeBtn({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "10px 14px",
        border: `1px solid ${active ? "var(--maroon)" : "var(--border-strong)"}`,
        background: active ? "var(--maroon-tint)" : "white",
        color: active ? "var(--maroon)" : "var(--ink)",
        borderRadius: 6,
        fontFamily: "inherit",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: active ? "var(--maroon)" : "var(--muted)", opacity: 0.85 }}>{sub}</span>
    </button>
  );
}
