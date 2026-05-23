"use client";

import type { PricingResult } from "@/features/pricing/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  result: PricingResult | null;
}

export function PriceBreakdownPanel({ result }: Props) {
  if (!result) {
    return (
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        Fill in the form to see the price breakdown.
      </div>
    );
  }

  const hasOverride = result.manualOverridePrice !== null;
  const showInfoBanner = result.warnings.some((w) => w.level === "WARNING" || w.level === "INFO");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Warning/info banner */}
      {showInfoBanner && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            fontSize: 12,
            background: hasOverride ? "#fef9c3" : "var(--maroon-tint)",
            color: hasOverride ? "#854d0e" : "var(--maroon)",
            border: `1px solid ${hasOverride ? "#fde047" : "var(--maroon)"}`,
            lineHeight: 1.5,
          }}
        >
          {result.warnings
            .filter((w) => w.level === "WARNING" || w.level === "INFO")
            .map((w, i) => (
              <div key={i}>{w.message}</div>
            ))}
        </div>
      )}

      <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8 }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Price Breakdown</div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "var(--maroon-tint)",
              color: "var(--maroon)",
              padding: "3px 8px",
              borderRadius: 4,
            }}
          >
            Live
          </span>
        </div>

        <div style={{ padding: 20 }}>
          {/* Base components */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <tbody>
              <Row label="Fuel cost" amount={result.fuelCost} />
              <Row label="Trip base rate" amount={result.tripBase} />
              {result.distanceCharge > 0 && <Row label="Distance charge" amount={result.distanceCharge} />}
              {result.otherDirectCosts.loadingUnloadingFee > 0 && (
                <Row label="Loading / Unloading" amount={result.otherDirectCosts.loadingUnloadingFee} />
              )}
              {result.otherDirectCosts.condoFee > 0 && (
                <Row label="Condo handling" amount={result.otherDirectCosts.condoFee} />
              )}
              {result.otherDirectCosts.cateringFee > 0 && (
                <Row label="Catering handling" amount={result.otherDirectCosts.cateringFee} />
              )}
              {result.otherDirectCosts.additionalHelperFee > 0 && (
                <Row label="Additional helper" amount={result.otherDirectCosts.additionalHelperFee} />
              )}
              {result.otherDirectCosts.excessHoursFee > 0 && (
                <Row label="Excess hours" amount={result.otherDirectCosts.excessHoursFee} />
              )}
              {result.otherDirectCosts.extraDropoffsFee > 0 && (
                <Row label="Extra drop-offs" amount={result.otherDirectCosts.extraDropoffsFee} />
              )}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "8px 0 4px", fontWeight: 600, fontSize: 13 }}>Base Costs</td>
                <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(result.baseCosts)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Markup allocations */}
          <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--surface)", borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
              Revenue allocations ({(result.markupRate * 100).toFixed(1)}% markup)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <tbody>
                <Row label="Driver" amount={result.allocations.driver} muted />
                <Row label="Helper" amount={result.allocations.helper} muted />
                <Row label="Overhead" amount={result.allocations.overhead} muted />
                {result.isLongDistance && (
                  <Row label={`Long-distance (≥ ${result.ratesSnapshot.longDistanceThresholdKm}km)`} amount={result.allocations.longDistance} muted />
                )}
              </tbody>
            </table>
          </div>

          {/* Revenue and VAT */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 12 }}>
            <tbody>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "8px 0 4px", fontWeight: 600 }}>Revenue (net of VAT)</td>
                <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(result.revenueNetOfVat)}
                </td>
              </tr>
              {result.discountAmount > 0 && (
                <Row label="Discount" amount={-result.discountAmount} muted />
              )}
              {result.vatAmount > 0 && (
                <Row
                  label={`VAT (${result.vatOption === "VAT_INCLUSIVE" ? "inclusive" : "exclusive"}, 12%)`}
                  amount={result.vatAmount}
                  muted
                />
              )}
              {result.tollFee > 0 && (
                <Row label="Toll" amount={result.tollFee} muted />
              )}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "10px 0 0", fontWeight: 700, fontSize: 14, color: hasOverride ? "var(--ink)" : "var(--maroon)" }}>
                  {hasOverride ? "Computed Quote" : "Final Quote"}
                </td>
                <td
                  style={{
                    padding: "10px 0 0",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 14,
                    color: hasOverride ? "var(--muted)" : "var(--maroon)",
                    fontVariantNumeric: "tabular-nums",
                    textDecoration: hasOverride ? "line-through" : "none",
                  }}
                >
                  {formatCurrency(result.computedFinalPrice)}
                </td>
              </tr>
              {hasOverride && (
                <tr>
                  <td style={{ padding: "6px 0 0", fontWeight: 700, fontSize: 15, color: "var(--maroon)" }}>
                    Final Quote (Override)
                  </td>
                  <td
                    style={{
                      padding: "6px 0 0",
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--maroon)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(result.finalPrice)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, amount, muted }: { label: string; amount: number; muted?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "3px 0", color: muted ? "var(--muted)" : "var(--ink)" }}>{label}</td>
      <td
        style={{
          padding: "3px 0",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          color: muted ? "var(--muted)" : "var(--ink)",
        }}
      >
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}
