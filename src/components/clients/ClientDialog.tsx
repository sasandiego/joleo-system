"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertClientAction } from "@/actions/clients";

interface ClientDialogProps {
  mode: "add" | "edit";
  client?: {
    id: string;
    companyName: string;
    contactPerson: string | null;
    mobile: string | null;
    email: string | null;
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

export function ClientDialog({ mode, client }: ClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(upsertClientAction, undefined);

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
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "white",
            borderRadius: 10,
            border: "1px solid var(--border)",
            padding: 32,
            width: 520,
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    gridColumn: "span 2",
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    type="text"
                    defaultValue={client?.companyName ?? ""}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Contact Person
                  </label>
                  <input
                    name="contactPerson"
                    type="text"
                    defaultValue={client?.contactPerson ?? ""}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Mobile
                  </label>
                  <input
                    name="mobile"
                    type="text"
                    defaultValue={client?.mobile ?? ""}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={client?.email ?? ""}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    defaultValue={client?.paymentTerms ?? ""}
                    style={inputStyle}
                  >
                    <option value="">— Select —</option>
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    gridColumn: "span 2",
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={client?.notes ?? ""}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: 80,
                    }}
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
