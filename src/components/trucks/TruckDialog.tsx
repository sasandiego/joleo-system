"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertTruckAction } from "@/actions/trucks";

interface TruckType {
  id: string;
  code: string;
  label: string;
  sizeFt: number;
  wheelType: string;
}

interface Truck {
  id: string;
  code: string;
  plateNo: string;
  truckTypeId: string;
  status: string;
  remarks: string | null;
}

interface TruckDialogProps {
  mode: "add" | "edit";
  truck?: Truck;
  truckTypes: TruckType[];
}

function SubmitButton({ mode }: { mode: "add" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: pending ? "var(--maroon-light)" : "var(--maroon)",
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
      {pending ? "Saving…" : mode === "add" ? "Add Truck" : "Save Changes"}
    </button>
  );
}

export function TruckDialog({ mode, truck, truckTypes }: TruckDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(upsertTruckAction, undefined);

  function handleOpenChange(v: boolean) {
    setOpen(v);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
            + Add Truck
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
            {mode === "add" ? "Add Truck" : `Edit Truck — ${truck?.code}`}
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
                {mode === "add" ? "Truck added successfully." : "Truck updated successfully."}
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
              {mode === "edit" && truck && (
                <input type="hidden" name="id" value={truck.id} />
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px 20px",
                }}
              >
                {/* Code */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="truck-code"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Code <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="truck-code"
                    name="code"
                    type="text"
                    required
                    defaultValue={truck?.code ?? ""}
                    readOnly={mode === "edit"}
                    placeholder="e.g. V5"
                    style={{
                      fontFamily: "inherit",
                      fontSize: 13.5,
                      padding: "9px 12px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 6,
                      background: mode === "edit" ? "var(--surface)" : "white",
                      color: "var(--ink)",
                      width: "100%",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Plate No */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="truck-plateNo"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Plate No. <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="truck-plateNo"
                    name="plateNo"
                    type="text"
                    required
                    defaultValue={truck?.plateNo ?? ""}
                    placeholder="e.g. ABC 1234"
                    style={{
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
                    }}
                  />
                </div>

                {/* Truck Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="truck-truckTypeId"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Truck Type <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="truck-truckTypeId"
                    name="truckTypeId"
                    required
                    defaultValue={truck?.truckTypeId ?? ""}
                    style={{
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
                    }}
                  >
                    <option value="">Select type…</option>
                    {truckTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.label} ({tt.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="truck-status"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Status <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="truck-status"
                    name="status"
                    required
                    defaultValue={truck?.status ?? "ACTIVE"}
                    style={{
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
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Remarks */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    gridColumn: "span 2",
                  }}
                >
                  <label
                    htmlFor="truck-remarks"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Remarks
                  </label>
                  <textarea
                    id="truck-remarks"
                    name="remarks"
                    defaultValue={truck?.remarks ?? ""}
                    placeholder="Optional notes…"
                    style={{
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
                      resize: "vertical",
                      minHeight: 80,
                    }}
                  />
                </div>
              </div>

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
                    marginTop: 16,
                  }}
                >
                  {state.error}
                </div>
              )}

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
                <SubmitButton mode={mode} />
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
