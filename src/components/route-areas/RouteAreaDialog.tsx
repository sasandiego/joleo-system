"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertRouteAreaAction } from "@/actions/route-areas";

interface RouteAreaDialogProps {
  mode: "add" | "edit";
  routeArea?: {
    id: string;
    code: string;
    label: string;
    sampleDest: string | null;
    distanceMinKm: number;
    distanceMaxKm: number;
    surcharge: number | string;
    estimatedToll: number | string;
    isLongDistance: boolean;
    remarks: string | null;
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
      {pending ? "Saving…" : mode === "add" ? "Add Route Area" : "Save Changes"}
    </button>
  );
}

export function RouteAreaDialog({ mode, routeArea }: RouteAreaDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(upsertRouteAreaAction, undefined);

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
            + Add Route Area
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
            {mode === "add" ? "Add Route Area" : "Edit Route Area"}
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
                Route area saved successfully.
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
              {mode === "edit" && routeArea && (
                <input type="hidden" name="id" value={routeArea.id} />
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
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink-soft)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Code
                  </label>
                  <input
                    name="code"
                    type="text"
                    defaultValue={routeArea?.code ?? ""}
                    readOnly={mode === "edit"}
                    required
                    onChange={(e) => {
                      if (mode === "add") {
                        e.target.value = e.target.value.toUpperCase();
                      }
                    }}
                    style={{
                      ...inputStyle,
                      background: mode === "edit" ? "var(--surface)" : "white",
                      color: mode === "edit" ? "var(--muted)" : "var(--ink)",
                      fontFamily: "var(--font-mono)",
                    }}
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
                    Label
                  </label>
                  <input
                    name="label"
                    type="text"
                    defaultValue={routeArea?.label ?? ""}
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
                    Min Distance (km)
                  </label>
                  <input
                    name="distanceMinKm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={routeArea?.distanceMinKm ?? ""}
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
                    Max Distance (km)
                  </label>
                  <input
                    name="distanceMaxKm"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={routeArea?.distanceMaxKm ?? ""}
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
                    Surcharge (₱)
                  </label>
                  <input
                    name="surcharge"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={routeArea ? Number(routeArea.surcharge) : ""}
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
                    Est. Toll (₱)
                  </label>
                  <input
                    name="estimatedToll"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={routeArea ? Number(routeArea.estimatedToll) : ""}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Long Distance checkbox — spans full row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    gridColumn: "span 2",
                    padding: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    name="isLongDistance"
                    id="isLongDistance"
                    defaultChecked={routeArea?.isLongDistance ?? false}
                    style={{ width: 16, height: 16, accentColor: "var(--maroon)", cursor: "pointer" }}
                  />
                  <label
                    htmlFor="isLongDistance"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-soft)",
                      cursor: "pointer",
                    }}
                  >
                    Long distance route (triggers long-distance surcharge)
                  </label>
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
                    Sample Destinations
                  </label>
                  <textarea
                    name="sampleDest"
                    defaultValue={routeArea?.sampleDest ?? ""}
                    placeholder="e.g. Marilao, Bulacan · San Jose del Monte"
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: 80,
                    }}
                  />
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
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    defaultValue={routeArea?.remarks ?? ""}
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
