"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateRateSettingsAction } from "@/actions/rate-settings";

interface RateSettings {
  dieselPricePerLiter: number;
  fuelSurchargePct: number;
  driverDailyRate: number;
  driverOtRate: number;
  helperDailyRate: number;
  helperOtRate: number;
  additionalHelperRate: number;
  standardIncludedHours: number;
  additionalHourRate: number;
  additionalDropoffCharge: number;
  condoHandlingFee: number;
  cateringHandlingFee: number;
  loadingUnloadingFee: number;
  nightDeliverySurcharge: number;
  waitingTimeChargePerHr: number;
  outOfTownSurcharge: number;
  longDistanceSurcharge: number;
  distanceRatePerKm: number;
  maintenancePctOfBase: number;
  overheadPctOfDirect: number;
  contingencyPctOfDirect: number;
  floorMarginPct: number;
  targetMarginPct: number;
  ceilingMarginPct: number;
  vatRate: number;
  updatedAt: string;
  updatedBy: string | null;
}

interface ChangeLogEntry {
  id: string;
  createdAt: string;
  userId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

interface Props {
  settings: RateSettings;
  changelog: ChangeLogEntry[];
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
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        padding: "9px 16px",
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function SettingRow({
  label,
  note,
  name,
  defaultValue,
  unit,
  step = "0.01",
  readOnly = false,
}: {
  label: string;
  note: string;
  name: string;
  defaultValue: number;
  unit: string;
  step?: string;
  readOnly?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 80px",
        alignItems: "center",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-soft)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{note}</div>
      </div>
      <input
        name={name}
        type="number"
        step={step}
        min="0"
        defaultValue={defaultValue}
        readOnly={readOnly}
        required
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          padding: "8px 10px",
          border: "1px solid var(--border-strong)",
          borderRadius: 6,
          background: readOnly ? "var(--surface)" : "white",
          color: readOnly ? "var(--muted)" : "var(--ink)",
          textAlign: "right",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{unit}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--maroon)",
        paddingTop: 24,
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RateSettingsForm({ settings: s, changelog }: Props) {
  const [state, formAction] = useActionState(updateRateSettingsAction, undefined);
  const [logOpen, setLogOpen] = useState(false);

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
  void inputStyle;

  return (
    <>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 24,
          marginBottom: 28,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Rate Settings
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Global pricing parameters · All future quotes use these values
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
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
            View change log
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div
        style={{
          background: "#FDF8EC",
          border: "1px solid #E9D9A8",
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 13,
          color: "var(--warning)",
          marginBottom: 24,
        }}
      >
        <strong>Heads up</strong> · Changes affect all new quotes immediately. Existing quotes keep their snapshotted rates.
      </div>

      {state?.success && (
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
          Rate settings saved successfully.
        </div>
      )}

      {state?.error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--danger)",
            background: "#FBEAE7",
            border: "1px solid #F5C2BC",
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 20,
          }}
        >
          {state.error}
        </div>
      )}

      {/* Settings form */}
      <form action={formAction}>
        <div
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 28px 28px",
            marginBottom: 24,
          }}
        >
          <SectionTitle>Fuel &amp; Operations</SectionTitle>
          <SettingRow
            label="Diesel Price per Liter"
            note="Update as pump price changes · Suggested ₱55 – ₱90"
            name="dieselPricePerLiter"
            defaultValue={s.dieselPricePerLiter}
            unit="₱ / L"
            step="0.01"
          />
          <SettingRow
            label="Fuel Surcharge %"
            note="Added on top of raw fuel cost · Suggested 0 – 15%"
            name="fuelSurchargePct"
            defaultValue={s.fuelSurchargePct}
            unit="%"
            step="0.01"
          />

          <SectionTitle>Manpower Rates</SectionTitle>
          <SettingRow
            label="Driver Daily Rate"
            note="8-hour standard shift"
            name="driverDailyRate"
            defaultValue={s.driverDailyRate}
            unit="₱ / day"
            step="1"
          />
          <SettingRow
            label="Driver Overtime Rate / hr"
            note="Per hour beyond standard shift"
            name="driverOtRate"
            defaultValue={s.driverOtRate}
            unit="₱ / hr"
            step="1"
          />
          <SettingRow
            label="Helper Daily Rate"
            note="8-hour standard shift"
            name="helperDailyRate"
            defaultValue={s.helperDailyRate}
            unit="₱ / day"
            step="1"
          />
          <SettingRow
            label="Helper Overtime Rate / hr"
            note="Per hour beyond standard shift"
            name="helperOtRate"
            defaultValue={s.helperOtRate}
            unit="₱ / hr"
            step="1"
          />
          <SettingRow
            label="Additional Helper Rate"
            note="Rate for each extra helper beyond the first"
            name="additionalHelperRate"
            defaultValue={s.additionalHelperRate}
            unit="₱ / day"
            step="1"
          />
          <SettingRow
            label="Standard Included Hours"
            note="Hours included in base price before overtime kicks in"
            name="standardIncludedHours"
            defaultValue={s.standardIncludedHours}
            unit="hours"
            step="1"
          />
          <SettingRow
            label="Additional Hour Rate"
            note="Charged per extra hour beyond standard"
            name="additionalHourRate"
            defaultValue={s.additionalHourRate}
            unit="₱ / hr"
            step="1"
          />

          <SectionTitle>Surcharges &amp; Fees</SectionTitle>
          <SettingRow
            label="Out-of-Town Surcharge"
            note="Beyond Metro Manila boundaries"
            name="outOfTownSurcharge"
            defaultValue={s.outOfTownSurcharge}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Long-Distance Surcharge"
            note="Trips exceeding 200 km one way"
            name="longDistanceSurcharge"
            defaultValue={s.longDistanceSurcharge}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Distance Rate per km"
            note="Applied to estimated total distance"
            name="distanceRatePerKm"
            defaultValue={s.distanceRatePerKm}
            unit="₱ / km"
            step="0.01"
          />
          <SettingRow
            label="Condo Handling Fee"
            note="Condo move-in/out surcharge"
            name="condoHandlingFee"
            defaultValue={s.condoHandlingFee}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Catering Handling Fee"
            note="Catering delivery surcharge"
            name="cateringHandlingFee"
            defaultValue={s.cateringHandlingFee}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Additional Drop-off Charge"
            note="Per extra drop-off beyond the first"
            name="additionalDropoffCharge"
            defaultValue={s.additionalDropoffCharge}
            unit="₱ each"
            step="1"
          />
          <SettingRow
            label="Loading / Unloading Fee"
            note="Optional charge for loading/unloading service"
            name="loadingUnloadingFee"
            defaultValue={s.loadingUnloadingFee}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Night Delivery Surcharge"
            note="For deliveries outside standard hours"
            name="nightDeliverySurcharge"
            defaultValue={s.nightDeliverySurcharge}
            unit="₱ flat"
            step="1"
          />
          <SettingRow
            label="Waiting Time Charge / hr"
            note="Charged per hour of waiting at pickup or drop-off"
            name="waitingTimeChargePerHr"
            defaultValue={s.waitingTimeChargePerHr}
            unit="₱ / hr"
            step="1"
          />

          <SectionTitle>Cost Allocations</SectionTitle>
          <SettingRow
            label="Maintenance % of Base"
            note="Vehicle maintenance allocation as % of base truck cost"
            name="maintenancePctOfBase"
            defaultValue={s.maintenancePctOfBase}
            unit="%"
            step="0.01"
          />
          <SettingRow
            label="Overhead % of Direct"
            note="Overhead allocation as % of direct costs"
            name="overheadPctOfDirect"
            defaultValue={s.overheadPctOfDirect}
            unit="%"
            step="0.01"
          />
          <SettingRow
            label="Contingency % of Direct"
            note="Contingency buffer as % of direct costs"
            name="contingencyPctOfDirect"
            defaultValue={s.contingencyPctOfDirect}
            unit="%"
            step="0.01"
          />

          <SectionTitle>Profit Margins</SectionTitle>
          <SettingRow
            label="Floor Profit Margin %"
            note="Minimum acceptable margin"
            name="floorMarginPct"
            defaultValue={s.floorMarginPct}
            unit="%"
            step="0.01"
          />
          <SettingRow
            label="Target Profit Margin %"
            note="Ideal per-booking margin"
            name="targetMarginPct"
            defaultValue={s.targetMarginPct}
            unit="%"
            step="0.01"
          />
          <SettingRow
            label="Ceiling Profit Margin %"
            note="Maximum ceiling for competitive pricing"
            name="ceilingMarginPct"
            defaultValue={s.ceilingMarginPct}
            unit="%"
            step="0.01"
          />

          <SectionTitle>Tax</SectionTitle>
          <div style={{ marginBottom: 4 }}>
            <SettingRow
              label="VAT Rate"
              note="Standard Philippine VAT · Locked at 12%"
              name="vatRate"
              defaultValue={s.vatRate}
              unit="%"
              readOnly
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Last saved{" "}
            {new Date(s.updatedAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {s.updatedBy ? ` by ${s.updatedBy}` : ""}
          </p>
          <SubmitButton />
        </div>
      </form>

      {/* Change log dialog */}
      <Dialog.Root open={logOpen} onOpenChange={setLogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50 }}
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
              width: 560,
              maxHeight: "80vh",
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
                marginBottom: 20,
              }}
            >
              Rate Settings Change Log
            </Dialog.Title>

            {changelog.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>No changes recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {changelog.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "12px 16px",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>
                        Settings updated
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>
                        {formatLogDate(entry.createdAt)}
                      </span>
                    </div>
                    {entry.before && entry.after && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {Object.keys(entry.after)
                          .filter(
                            (k) =>
                              k !== "id" &&
                              k !== "updatedAt" &&
                              k !== "updatedBy" &&
                              String(entry.before?.[k]) !== String(entry.after?.[k])
                          )
                          .map((k) => (
                            <div key={k} style={{ fontSize: 12, color: "var(--muted)" }}>
                              <span style={{ fontFamily: "var(--font-mono)" }}>{k}</span>
                              {" · "}
                              <span style={{ color: "var(--danger)" }}>
                                {String(entry.before?.[k])}
                              </span>
                              {" → "}
                              <span style={{ color: "var(--success)" }}>
                                {String(entry.after?.[k])}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
