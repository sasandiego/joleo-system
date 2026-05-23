"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertDriverAction } from "@/actions/drivers";

interface Driver {
  id: string;
  employeeId: string;
  fullName: string;
  dailyRate: unknown;
  otRate: unknown;
  status: string;
  remarks: string | null;
}

interface DriverDialogProps {
  mode: "add" | "edit";
  driver?: Driver;
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
      {pending ? "Saving…" : mode === "add" ? "Add Driver" : "Save Changes"}
    </button>
  );
}

export function DriverDialog({ mode, driver }: DriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(upsertDriverAction, undefined);

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
            + Add Driver
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
            {mode === "add" ? "Add Driver" : `Edit Driver — ${driver?.fullName}`}
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
                {mode === "add" ? "Driver added successfully." : "Driver updated successfully."}
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
              {mode === "edit" && driver && (
                <input type="hidden" name="id" value={driver.id} />
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px 20px",
                }}
              >
                {/* Employee ID */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="driver-employeeId"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Employee ID <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="driver-employeeId"
                    name="employeeId"
                    type="text"
                    required
                    defaultValue={driver?.employeeId ?? ""}
                    readOnly={mode === "edit"}
                    placeholder="e.g. 2013030"
                    style={{
                      fontFamily: "var(--font-mono)",
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

                {/* Full Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="driver-fullName"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Full Name <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="driver-fullName"
                    name="fullName"
                    type="text"
                    required
                    defaultValue={driver?.fullName ?? ""}
                    placeholder="e.g. Juan Dela Cruz"
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

                {/* Daily Rate */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="driver-dailyRate"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Daily Rate (₱) <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="driver-dailyRate"
                    name="dailyRate"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    defaultValue={driver ? Number(driver.dailyRate) : ""}
                    placeholder="e.g. 800"
                    style={{
                      fontFamily: "var(--font-mono)",
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

                {/* OT Rate */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="driver-otRate"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    OT Rate (₱/hr) <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="driver-otRate"
                    name="otRate"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    defaultValue={driver ? Number(driver.otRate) : ""}
                    placeholder="e.g. 125"
                    style={{
                      fontFamily: "var(--font-mono)",
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

                {/* Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor="driver-status"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Status <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="driver-status"
                    name="status"
                    required
                    defaultValue={driver?.status ?? "ACTIVE"}
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
                    htmlFor="driver-remarks"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.01em" }}
                  >
                    Remarks
                  </label>
                  <textarea
                    id="driver-remarks"
                    name="remarks"
                    defaultValue={driver?.remarks ?? ""}
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
