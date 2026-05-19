import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PricingResult } from "@/features/pricing/types";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      client: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
      booking: { select: { bookingNo: true, id: true } },
    },
  });

  const truckType = quote?.truckTypeId
    ? await db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
    : null;

  if (!quote) notFound();

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title={quote.quoteNo}
        subtitle={`${quote.status} · ${formatDate(quote.createdAt)}`}
      >
        <Link
          href="/quotes"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--fg)",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
        <a
          href={`/api/quotes/${quote.id}/pdf`}
          target="_blank"
          style={{
            background: "var(--maroon)",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Download PDF
        </a>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        {/* Left: details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Info card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
              Booking Information
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <DetailRow label="Client" value={quote.client?.companyName ?? quote.walkInName ?? "Walk-in"} />
              <DetailRow label="Service Type" value={quote.serviceType.replace(/_/g, " ")} />
              <DetailRow label="Pick-up" value={quote.pickupPoint} />
              <DetailRow label="Drop-off" value={quote.dropoffPoint} />
              <DetailRow label="Distance" value={`${quote.estimatedDistanceKm} km`} />
              <DetailRow label="Drop-offs" value={String(quote.numberOfDropoffs)} />
            </div>
          </div>

          {/* Truck & crew card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
              Truck & Crew
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <DetailRow label="Truck Type" value={truckType?.label ?? "—"} />
              <DetailRow label="Helpers" value={String(quote.numberOfHelpers)} />
              <DetailRow label="Est. Hours" value={`${quote.estimatedHours ?? "—"} hrs`} />
            </div>
          </div>

          {/* Flags */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
              Service Flags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Condo Service", active: quote.condoService },
                { label: "Catering", active: quote.cateringService },
                { label: "Night Delivery", active: quote.nightDelivery },
                { label: "Additional Helper", active: quote.additionalHelper },
                { label: "Out of Town", active: quote.outOfTown },
                { label: "Long Distance", active: quote.longDistance },
              ].map(({ label, active }) => (
                <span
                  key={label}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    background: active ? "var(--maroon-tint)" : "var(--bg)",
                    color: active ? "var(--maroon)" : "var(--muted)",
                    border: "1px solid",
                    borderColor: active ? "var(--maroon)" : "var(--border)",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {quote.booking && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Converted to Booking</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{quote.booking.bookingNo}</div>
              </div>
              <Link
                href={`/bookings/${quote.booking.id}`}
                style={{ fontSize: 13, color: "var(--maroon)", textDecoration: "none" }}
              >
                View Booking →
              </Link>
            </div>
          )}
        </div>

        {/* Right: pricing breakdown */}
        <div style={{ position: "sticky", top: 72 }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Price Computation</div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--maroon-tint)", color: "var(--maroon)", padding: "3px 8px", borderRadius: 4 }}>
                Snapshot
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {pricing.lineItems.filter((li) => li.amount !== 0).map((li) => (
                    <tr key={li.code}>
                      <td style={{ padding: "4px 0", color: "var(--fg)" }}>{li.label}</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(li.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "8px 0 4px", fontWeight: 600 }}>Direct Cost Subtotal</td>
                    <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.directCostSubtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0", color: "var(--muted)" }}>Overhead ({(pricing.overheadAllocation / pricing.directCostSubtotal * 100).toFixed(0)}%)</td>
                    <td style={{ padding: "4px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.overheadAllocation)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0", color: "var(--muted)" }}>Contingency ({(pricing.contingencyBuffer / pricing.directCostSubtotal * 100).toFixed(0)}%)</td>
                    <td style={{ padding: "4px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.contingencyBuffer)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "8px 0 4px", fontWeight: 600 }}>Total Cost Before Profit</td>
                    <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.totalCostBeforeProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "16px 0" }}>
                {[
                  { label: "Floor", value: pricing.floorPrice },
                  { label: "Target", value: pricing.targetPrice },
                  { label: "Ceiling", value: pricing.ceilingPrice },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      textAlign: "center",
                      padding: "10px 6px",
                      border: "1px solid",
                      borderRadius: 6,
                      borderColor: label === "Target" ? "var(--maroon)" : "var(--border)",
                      background: label === "Target" ? "var(--maroon-tint)" : "transparent",
                    }}
                  >
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: label === "Target" ? "var(--maroon)" : "var(--fg)", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(value)}
                    </div>
                  </div>
                ))}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {pricing.discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: "4px 0", color: "var(--muted)" }}>Discount</td>
                      <td style={{ padding: "4px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                        −{formatCurrency(pricing.discountAmount)}
                      </td>
                    </tr>
                  )}
                  {pricing.vatAmount > 0 && (
                    <tr>
                      <td style={{ padding: "4px 0", color: "var(--muted)" }}>VAT ({pricing.inputsSnapshot.vatOption.replace(/_/g, " ")})</td>
                      <td style={{ padding: "4px 0", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(pricing.vatAmount)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "10px 0 0", fontWeight: 700, fontSize: 15 }}>Final Quoted Price</td>
                    <td style={{ padding: "10px 0 0", textAlign: "right", fontWeight: 700, fontSize: 15, color: "var(--maroon)", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.finalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 6, fontSize: 12, background: "var(--bg)", border: "1px solid var(--border)" }}>
                Actual margin: {(pricing.actualMarginPct * 100).toFixed(1)}% · Computed {new Date(pricing.computedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
