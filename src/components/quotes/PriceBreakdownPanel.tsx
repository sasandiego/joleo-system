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
          background: "var(--card)",
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

  const floorWarning = result.warnings.find((w) => w.code === "PRICE_VS_FLOOR");
  const marginWarning = result.warnings.find((w) => w.code === "PROFIT_MARGIN");
  const hoursWarning = result.warnings.find((w) => w.code === "JOB_HOURS");

  const hasError = [floorWarning, marginWarning, hoursWarning].some((w) => w?.level === "ERROR");
  const hasWarning = !hasError && [floorWarning, marginWarning, hoursWarning].some((w) => w?.level === "WARNING");

  const alertBg = hasError ? "#fee2e2" : hasWarning ? "#fef9c3" : "#dcfce7";
  const alertColor = hasError ? "#991b1b" : hasWarning ? "#854d0e" : "#166534";
  const alertBorder = hasError ? "#fca5a5" : hasWarning ? "#fde047" : "#86efac";

  const activeMessages = [floorWarning, marginWarning, hoursWarning]
    .filter((w) => w && w.level !== "OK")
    .map((w) => w!.message);

  const okMessages = [floorWarning, marginWarning, hoursWarning]
    .filter((w) => w?.level === "OK")
    .map((w) => w!.message);

  const statusLine =
    activeMessages.length > 0
      ? activeMessages[0]
      : okMessages.length > 0
      ? `Margin ${(result.actualMarginPct * 100).toFixed(1)}% is on target · Price meets floor.`
      : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Status alert */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          background: alertBg,
          color: alertColor,
          border: `1px solid ${alertBorder}`,
        }}
      >
        <strong>{hasError ? "Error" : hasWarning ? "Warning" : "OK"}</strong> · {statusLine}
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Price Computation</div>
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
          {/* Line items */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <tbody>
              {result.lineItems.map((li) => (
                <tr key={li.code} style={{ opacity: li.amount === 0 ? 0.35 : 1 }}>
                  <td style={{ padding: "3px 0", color: "var(--fg)" }}>{li.label}</td>
                  <td
                    style={{
                      padding: "3px 0",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: li.amount === 0 ? "var(--muted)" : "var(--fg)",
                    }}
                  >
                    {formatCurrency(li.amount)}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "8px 0 4px", fontWeight: 600, fontSize: 13 }}>Direct Cost Subtotal</td>
                <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(result.directCostSubtotal)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "var(--muted)", fontSize: 12 }}>Overhead</td>
                <td style={{ padding: "3px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                  {formatCurrency(result.overheadAllocation)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", color: "var(--muted)", fontSize: 12 }}>Contingency</td>
                <td style={{ padding: "3px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                  {formatCurrency(result.contingencyBuffer)}
                </td>
              </tr>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "8px 0 4px", fontWeight: 600, fontSize: 13 }}>Total Cost Before Profit</td>
                <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(result.totalCostBeforeProfit)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tier grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "16px 0" }}>
            {[
              { label: "Floor", value: result.floorPrice, isTarget: false },
              { label: "Target", value: result.targetPrice, isTarget: true },
              { label: "Ceiling", value: result.ceilingPrice, isTarget: false },
            ].map(({ label, value, isTarget }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "10px 6px",
                  border: "1px solid",
                  borderRadius: 6,
                  borderColor: isTarget ? "var(--maroon)" : "var(--border)",
                  background: isTarget ? "var(--maroon-tint)" : "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: isTarget ? "var(--maroon)" : "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isTarget ? "var(--maroon)" : "var(--fg)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(value)}
                </div>
              </div>
            ))}
          </div>

          {/* VAT and final */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <tbody>
              {result.discountAmount > 0 && (
                <tr>
                  <td style={{ padding: "3px 0", color: "var(--muted)" }}>Discount</td>
                  <td style={{ padding: "3px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    −{formatCurrency(result.discountAmount)}
                  </td>
                </tr>
              )}
              {result.vatAmount > 0 && (
                <tr>
                  <td style={{ padding: "3px 0", color: "var(--muted)" }}>
                    VAT ({result.inputsSnapshot.vatOption === "VAT_INCLUSIVE" ? "inclusive, extracted" : "exclusive, added"})
                  </td>
                  <td style={{ padding: "3px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(result.vatAmount)}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "10px 0 0", fontWeight: 700, fontSize: 14 }}>Final Quoted Price</td>
                <td
                  style={{
                    padding: "10px 0 0",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--maroon)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(result.finalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
