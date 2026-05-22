"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Decimal from "decimal.js";
import { computePrice } from "@/features/pricing/engine";
import {
  updatePricingConfigAction,
  resetPricingConfigDefaultsAction,
  type PricingConfigState,
} from "@/actions/pricing-config";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/format";

interface Settings {
  driverRate: number;
  helperRate: number;
  overheadRate: number;
  longDistanceRate: number;
  longDistanceThresholdKm: number;
  dieselPricePerLiter: number;
  fuelFloor: number;
  fuelEfficiencyKmpl: number;
  additionalHelperRate: number;
  additionalHourRate: number;
  additionalDropoffCharge: number;
  standardIncludedHours: number;
  condoHandlingFee: number;
  cateringHandlingFee: number;
  loadingUnloadingFee: number;
  distanceRatePerKm: number;
  vatRate: number;
  updatedAt: string;
  updatedBy: string | null;
}

interface TruckTypeRate {
  id: string;
  code: string;
  label: string;
  sizeFt: number;
  wheelType: string;
  eightHourBaseRate: number;
  perTripBaseRate: number;
}

interface ChangelogEntry {
  id: string;
  action: string;
  createdAt: string;
  userId: string | null;
}

interface Props {
  settings: Settings;
  truckTypes: TruckTypeRate[];
  changelog: ChangelogEntry[];
}

// Wraps a number so it satisfies the `{ toNumber(): number }` interface
// the pricing engine expects for Prisma-like Decimal fields.
const w = (n: number) => ({ toNumber: () => n });

export function PricingConfigForm({ settings, truckTypes, changelog }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState<PricingConfigState, FormData>(
    updatePricingConfigAction,
    undefined,
  );
  const [resetState, setResetState] = useState<PricingConfigState>(undefined);
  const [, startTransition] = useTransition();

  // ── Editable state ─────────────────────────────────────────────────────────
  const [s, setS] = useState(settings);
  const [tt, setTT] = useState(truckTypes);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  // Track dirtiness vs. server values
  const isDirty = useMemo(() => {
    if (JSON.stringify(s) !== JSON.stringify(settings)) return true;
    return tt.some((t, i) => {
      const orig = truckTypes[i];
      return t.eightHourBaseRate !== orig.eightHourBaseRate || t.perTripBaseRate !== orig.perTripBaseRate;
    });
  }, [s, tt, settings, truckTypes]);

  const totalMarkup = s.driverRate + s.helperRate + s.overheadRate + s.longDistanceRate;
  const markupOk = totalMarkup < 100;

  // ── Live preview using the actual engine ──────────────────────────────────
  // Sample trip: 30km, EIGHT_HOUR, first truck type, VAT-EXCLUSIVE
  const preview = useMemo(() => {
    if (tt.length === 0) return null;
    try {
      const result = computePrice(
        {
          estimatedDistanceKm: 30,
          estimatedJobHours: 8,
          tripBillingType: "EIGHT_HOUR",
          numberOfDropoffs: 1,
          condoService: false,
          cateringService: false,
          additionalHelper: false,
          tollFee: 0,
          discountAmount: 0,
          vatOption: "VAT_EXCLUSIVE",
        },
        {
          truckType: {
            eightHourBaseRate: new Decimal(tt[0].eightHourBaseRate),
            perTripBaseRate: new Decimal(tt[0].perTripBaseRate),
          },
          settings: {
            driverRate: w(s.driverRate / 100),
            helperRate: w(s.helperRate / 100),
            overheadRate: w(s.overheadRate / 100),
            longDistanceRate: w(s.longDistanceRate / 100),
            longDistanceThresholdKm: s.longDistanceThresholdKm,
            dieselPricePerLiter: w(s.dieselPricePerLiter),
            fuelFloor: w(s.fuelFloor),
            fuelEfficiencyKmpl: w(s.fuelEfficiencyKmpl),
            additionalHelperRate: w(s.additionalHelperRate),
            additionalHourRate: w(s.additionalHourRate),
            additionalDropoffCharge: w(s.additionalDropoffCharge),
            standardIncludedHours: s.standardIncludedHours,
            condoHandlingFee: w(s.condoHandlingFee),
            cateringHandlingFee: w(s.cateringHandlingFee),
            loadingUnloadingFee: w(s.loadingUnloadingFee),
            distanceRatePerKm: w(s.distanceRatePerKm),
            vatRate: w(s.vatRate / 100),
          },
        },
      );
      return { result, truckCode: tt[0].code, error: null as string | null };
    } catch (e) {
      return { result: null, truckCode: tt[0].code, error: (e as Error).message };
    }
  }, [s, tt]);

  // Where does fuel floor kick in given current rates?
  const fuelFloorBreakeven = useMemo(() => {
    // floor = distance × 2 / eff × price → distance = floor × eff / (2 × price)
    if (s.dieselPricePerLiter <= 0 || s.fuelEfficiencyKmpl <= 0) return null;
    return (s.fuelFloor * s.fuelEfficiencyKmpl) / (2 * s.dieselPricePerLiter);
  }, [s.fuelFloor, s.fuelEfficiencyKmpl, s.dieselPricePerLiter]);

  // ── Submit handler ────────────────────────────────────────────────────────
  function handleSaveClick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!markupOk) return;
    setConfirmOpen(true);
  }

  function confirmAndSubmit() {
    const form = document.getElementById("pricing-config-form") as HTMLFormElement | null;
    if (!form) return;
    setConfirmOpen(false);
    const fd = new FormData(form);
    // Append per-truck-type rates as JSON
    fd.set(
      "truckTypeRates",
      JSON.stringify(
        tt.map((t) => ({
          id: t.id,
          eightHourBaseRate: t.eightHourBaseRate,
          perTripBaseRate: t.perTripBaseRate,
        })),
      ),
    );
    startTransition(() => {
      formAction(fd);
    });
  }

  function confirmReset() {
    setResetConfirmOpen(false);
    startTransition(async () => {
      const result = await resetPricingConfigDefaultsAction();
      setResetState(result);
      if (result?.success) {
        router.refresh();
      }
    });
  }

  const lastUpdatedDate = new Date(s.updatedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <PageHeader title="Pricing Config" subtitle="Rates, markups, and per-truck-type base prices used by the quote engine">
        <button
          type="button"
          data-btn
          onClick={() => setChangelogOpen(true)}
          style={ghostBtn}
        >
          Audit log ({changelog.length})
        </button>
        <button
          type="button"
          data-btn
          onClick={() => setResetConfirmOpen(true)}
          style={ghostBtn}
        >
          Reset to defaults
        </button>
        <button
          type="submit"
          form="pricing-config-form"
          data-btn
          disabled={!isDirty || !markupOk}
          style={{
            ...primaryBtn,
            opacity: !isDirty || !markupOk ? 0.5 : 1,
            cursor: !isDirty || !markupOk ? "not-allowed" : "pointer",
          }}
        >
          Save changes
        </button>
      </PageHeader>

      {state?.error && <Banner kind="error">{state.error}</Banner>}
      {state?.success && <Banner kind="success">Pricing config saved. The new rates apply to all future quotes.</Banner>}
      {resetState?.error && <Banner kind="error">{resetState.error}</Banner>}
      {resetState?.success && <Banner kind="success">Reset to default rates.</Banner>}

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 18 }}>
        Last updated by <strong>{s.updatedBy ?? "—"}</strong> on {lastUpdatedDate}
      </div>

      <form id="pricing-config-form" action={formAction} onSubmit={handleSaveClick}>
        {/* Hidden field carrying per-truck-type JSON (set on submit) */}
        <input type="hidden" name="truckTypeRates" value="" readOnly />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* ───────── Left: editable sections ───────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <SectionCard title="1 · Labor Markups" hint="Percentage of Revenue Net of VAT allocated to driver and helper compensation.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Driver Rate" suffix="%">
                  <input
                    name="driverRate"
                    type="number"
                    step={0.01}
                    style={input}
                    value={s.driverRate}
                    onChange={(e) => setS({ ...s, driverRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Helper Rate" suffix="%">
                  <input
                    name="helperRate"
                    type="number"
                    step={0.01}
                    style={input}
                    value={s.helperRate}
                    onChange={(e) => setS({ ...s, helperRate: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="2 · Overhead & Surcharges" hint="Long-distance surcharge applies automatically when trip distance meets or exceeds the threshold.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Field label="Overhead Rate" suffix="%">
                  <input
                    name="overheadRate"
                    type="number"
                    step={0.01}
                    style={input}
                    value={s.overheadRate}
                    onChange={(e) => setS({ ...s, overheadRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Long-Distance Surcharge" suffix="%">
                  <input
                    name="longDistanceRate"
                    type="number"
                    step={0.01}
                    style={input}
                    value={s.longDistanceRate}
                    onChange={(e) => setS({ ...s, longDistanceRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Threshold" suffix="km">
                  <input
                    name="longDistanceThresholdKm"
                    type="number"
                    step={1}
                    min={1}
                    style={input}
                    value={s.longDistanceThresholdKm}
                    onChange={(e) => setS({ ...s, longDistanceThresholdKm: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: markupOk ? "var(--surface)" : "#fee2e2",
                  border: markupOk ? "1px solid var(--border)" : "1px solid #fca5a5",
                  fontSize: 12,
                  color: markupOk ? "var(--muted)" : "#991b1b",
                }}
              >
                <strong>Total markup (at long-distance trips):</strong> {totalMarkup.toFixed(2)}% &nbsp;
                {markupOk ? (
                  <>OK — well below 100%</>
                ) : (
                  <>⚠ Must be less than 100%. The pricing formula will fail.</>
                )}
              </div>
            </SectionCard>

            <SectionCard title="3 · Fuel Configuration" hint="Fuel cost uses MAX(floor, distance × 2 / efficiency × price). Update the diesel price as it changes at the pump.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Field label="Current Fuel Price" suffix="₱/L">
                  <input
                    name="dieselPricePerLiter"
                    type="number"
                    step={0.01}
                    min={0.01}
                    style={input}
                    value={s.dieselPricePerLiter}
                    onChange={(e) => setS({ ...s, dieselPricePerLiter: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Fuel Floor" suffix="₱">
                  <input
                    name="fuelFloor"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.fuelFloor}
                    onChange={(e) => setS({ ...s, fuelFloor: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Fuel Efficiency" suffix="km/L">
                  <input
                    name="fuelEfficiencyKmpl"
                    type="number"
                    step={0.01}
                    min={0.01}
                    style={input}
                    value={s.fuelEfficiencyKmpl}
                    onChange={(e) => setS({ ...s, fuelEfficiencyKmpl: Number(e.target.value) })}
                  />
                </Field>
              </div>
              {fuelFloorBreakeven !== null && (
                <div style={hintStyle}>
                  At current rates, the ₱{s.fuelFloor.toLocaleString("en-PH")} floor applies for trips below ~
                  {fuelFloorBreakeven.toFixed(1)} km.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="4 · Trip Base Rates (per truck type)"
              hint="Base rate before markups and fuel. Each truck type has both an 8-hour and a per-trip rate."
            >
              <div style={{ overflow: "hidden", border: "1px solid var(--border)", borderRadius: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--surface)" }}>
                      <th style={th}>Truck Type</th>
                      <th style={th}>8-Hour Base ₱</th>
                      <th style={th}>Per-Trip Base ₱</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tt.map((t, i) => (
                      <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ fontWeight: 600 }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                            {t.code}
                          </div>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <input
                            type="number"
                            step={1}
                            min={0}
                            style={input}
                            value={t.eightHourBaseRate}
                            onChange={(e) => {
                              const next = [...tt];
                              next[i] = { ...t, eightHourBaseRate: Number(e.target.value) };
                              setTT(next);
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <input
                            type="number"
                            step={1}
                            min={0}
                            style={input}
                            value={t.perTripBaseRate}
                            onChange={(e) => {
                              const next = [...tt];
                              next[i] = { ...t, perTripBaseRate: Number(e.target.value) };
                              setTT(next);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="5 · Service Add-ons" hint="These fees are added to direct costs when their flag is set on a quote (or, for excess hours / extra drop-offs, when the trip exceeds the standard).">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Field label="Standard Hours" suffix="hrs">
                  <input
                    name="standardIncludedHours"
                    type="number"
                    step={1}
                    min={1}
                    style={input}
                    value={s.standardIncludedHours}
                    onChange={(e) => setS({ ...s, standardIncludedHours: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Additional Hour" suffix="₱">
                  <input
                    name="additionalHourRate"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.additionalHourRate}
                    onChange={(e) => setS({ ...s, additionalHourRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Additional Helper" suffix="₱">
                  <input
                    name="additionalHelperRate"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.additionalHelperRate}
                    onChange={(e) => setS({ ...s, additionalHelperRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Extra Drop-off" suffix="₱">
                  <input
                    name="additionalDropoffCharge"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.additionalDropoffCharge}
                    onChange={(e) => setS({ ...s, additionalDropoffCharge: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Condo Handling" suffix="₱">
                  <input
                    name="condoHandlingFee"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.condoHandlingFee}
                    onChange={(e) => setS({ ...s, condoHandlingFee: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Catering Handling" suffix="₱">
                  <input
                    name="cateringHandlingFee"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.cateringHandlingFee}
                    onChange={(e) => setS({ ...s, cateringHandlingFee: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Loading / Unloading" suffix="₱">
                  <input
                    name="loadingUnloadingFee"
                    type="number"
                    step={1}
                    min={0}
                    style={input}
                    value={s.loadingUnloadingFee}
                    onChange={(e) => setS({ ...s, loadingUnloadingFee: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Distance Rate" suffix="₱/km">
                  <input
                    name="distanceRatePerKm"
                    type="number"
                    step={0.01}
                    min={0}
                    style={input}
                    value={s.distanceRatePerKm}
                    onChange={(e) => setS({ ...s, distanceRatePerKm: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="6 · Tax" hint="VAT is regulated by BIR at 12% and cannot be changed in this UI.">
              <Field label="VAT Rate" suffix="%">
                <input
                  type="number"
                  style={{ ...input, background: "var(--surface)", color: "var(--muted)" }}
                  value={s.vatRate}
                  disabled
                  readOnly
                />
              </Field>
            </SectionCard>
          </div>

          {/* ───────── Right: live preview ───────── */}
          <div style={{ position: "sticky", top: 72 }}>
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Live Preview
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, marginTop: 2 }}>
                  Sample 30 km · 8-hour
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Using {preview?.truckCode ?? "—"} · VAT-Exclusive
                </div>
              </div>
              <div style={{ padding: 16, fontSize: 12 }}>
                {preview?.error ? (
                  <div style={{ color: "#991b1b" }}>{preview.error}</div>
                ) : preview?.result ? (
                  <>
                    <PreviewRow label="Fuel" value={preview.result.fuelCost} />
                    <PreviewRow label="Trip Base" value={preview.result.tripBase} />
                    <PreviewRow label="Distance Charge" value={preview.result.distanceCharge} />
                    {preview.result.otherDirectCosts.loadingUnloadingFee > 0 && (
                      <PreviewRow label="Loading Fee" value={preview.result.otherDirectCosts.loadingUnloadingFee} />
                    )}
                    <PreviewRow label="Base Costs" value={preview.result.baseCosts} bold />
                    <Divider />
                    <PreviewRow label="Driver alloc." value={preview.result.allocations.driver} muted />
                    <PreviewRow label="Helper alloc." value={preview.result.allocations.helper} muted />
                    <PreviewRow label="Overhead alloc." value={preview.result.allocations.overhead} muted />
                    {preview.result.isLongDistance && (
                      <PreviewRow label="Long-dist. alloc." value={preview.result.allocations.longDistance} muted />
                    )}
                    <PreviewRow label="Revenue (net of VAT)" value={preview.result.revenueNetOfVat} bold />
                    <PreviewRow label="VAT (12%)" value={preview.result.vatAmount} muted />
                    <Divider />
                    <PreviewRow label="FINAL QUOTE" value={preview.result.finalPrice} bold large />
                  </>
                ) : (
                  <div style={{ color: "var(--muted)" }}>No truck types configured.</div>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
              Updates in real time as you edit the rates. Save to apply to future quotes.
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation modal: Save */}
      {confirmOpen && (
        <Modal title="Save pricing config?" onClose={() => setConfirmOpen(false)}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 16px" }}>
            This will affect <strong>all future quotes</strong>. Existing quotes keep their snapshotted rates and are not affected.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" data-btn onClick={() => setConfirmOpen(false)} style={ghostBtn}>
              Cancel
            </button>
            <button type="button" data-btn onClick={confirmAndSubmit} style={primaryBtn}>
              Yes, save
            </button>
          </div>
        </Modal>
      )}

      {/* Confirmation modal: Reset */}
      {resetConfirmOpen && (
        <Modal title="Reset to defaults?" onClose={() => setResetConfirmOpen(false)}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 16px" }}>
            All rates will revert to the system defaults from the Update Guide. Per-truck-type base rates are <strong>not</strong> reset.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" data-btn onClick={() => setResetConfirmOpen(false)} style={ghostBtn}>
              Cancel
            </button>
            <button type="button" data-btn onClick={confirmReset} style={primaryBtn}>
              Reset
            </button>
          </div>
        </Modal>
      )}

      {/* Audit log modal */}
      {changelogOpen && (
        <Modal title="Pricing Config — Audit Log" onClose={() => setChangelogOpen(false)} wide>
          {changelog.length === 0 ? (
            <p className="j-empty" style={{ padding: 24 }}>No changes yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
              {changelog.map((c) => (
                <li
                  key={c.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                    {new Date(c.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  <span>{c.action === "PRICING_CONFIG_RESET_DEFAULTS" ? "Reset to defaults" : "Config updated"}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>by {c.userId ?? "system"}</span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)" }}>
            Showing last {changelog.length} entries. Full history is preserved in the audit log.
          </div>
        </Modal>
      )}

      <div style={{ marginTop: 32, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--muted)" }}>
        <strong>Need an old field?</strong> Driver/helper daily rates, night surcharges, out-of-town surcharges, parking fees, and waiting-time charges were removed during the pricing engine refactor. See{" "}
        <Link href="/quotes" style={{ color: "var(--maroon)" }}>existing quotes</Link>{" "}
        for historical breakdowns — those snapshots are preserved.
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 14, lineHeight: 1.45 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
        {label} {suffix && <span style={{ color: "var(--ink-soft)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>({suffix})</span>}
      </label>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, bold, muted, large }: { label: string; value: number; bold?: boolean; muted?: boolean; large?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        fontSize: large ? 14 : 12,
        fontWeight: bold ? 600 : 400,
        color: muted ? "var(--muted)" : large ? "var(--maroon)" : "var(--ink)",
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(value)}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />;
}

function Banner({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const bg = kind === "error" ? "#fee2e2" : "#d1fae5";
  const fg = kind === "error" ? "#991b1b" : "#065f46";
  const border = kind === "error" ? "#fca5a5" : "#86efac";
  return (
    <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 6, background: bg, color: fg, border: `1px solid ${border}`, fontSize: 13 }}>
      {children}
    </div>
  );
}

function Modal({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,10,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 10,
          padding: 22,
          width: "100%",
          maxWidth: wide ? 560 : 420,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, marginBottom: 12 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--border)",
  borderRadius: 6,
  background: "white",
  fontFamily: "inherit",
  fontVariantNumeric: "tabular-nums",
};

const primaryBtn: React.CSSProperties = {
  background: "var(--maroon)",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
  color: "var(--ink-soft)",
  fontFamily: "inherit",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const hintStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "8px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  fontSize: 11.5,
  color: "var(--muted)",
};
