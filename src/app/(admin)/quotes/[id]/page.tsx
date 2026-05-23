import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { PricingResult } from "@/features/pricing/types";
import Link from "next/link";
import { ClientMessageDrafter } from "@/components/quotes/ClientMessageDrafter";
import { convertQuoteToBookingAction } from "@/actions/quotes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      client: { select: { clientName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
      booking: { select: { bookingNo: true, id: true } },
    },
  });

  const truckType = quote?.truckTypeId
    ? await db.truckType.findUnique({
        where: { id: quote.truckTypeId },
        select: { label: true },
      })
    : null;

  if (!quote) notFound();

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  const hasOverride = pricing.manualOverridePrice !== null && pricing.manualOverridePrice !== undefined;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title={quote.quoteNo}
        subtitle={`${quote.status} · ${formatDateTime(quote.createdAt)}${quote.booking ? " · Converted" : ""}`}
      >
        <Link
          href="/quotes"
          data-btn
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
        <Link
          href={`/quotes/${quote.id}/edit`}
          data-btn
          style={{
            background: "transparent",
            border: "1px solid var(--maroon)",
            color: "var(--maroon)",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Edit
        </Link>
        {!quote.booking && (
          <form action={convertQuoteToBookingAction}>
            <input type="hidden" name="quoteId" value={quote.id} />
            <button
              type="submit"
              data-btn
              style={{
                background: "transparent",
                border: "1px solid var(--maroon)",
                color: "var(--maroon)",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Convert to Booking
            </button>
          </form>
        )}
        <a
          href={`/api/quotes/${quote.id}/pdf`}
          target="_blank"
          data-btn
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
          {/* Booking info */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={sectionTitle}>Booking Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <DetailRow label="Client" value={quote.client?.clientName ?? quote.walkInName ?? "Walk-in"} />
              <DetailRow label="Service Type" value={quote.serviceType.replace(/_/g, " ")} />
              <DetailRow
                label="Scheduled Date"
                value={quote.scheduledDate ? formatDate(quote.scheduledDate) : "—"}
              />
              <DetailRow label="Start Time" value={quote.scheduledStartTime ?? "—"} />
              <DetailRow label="Pick-up" value={quote.pickupPoint} />
              <DetailRow label="Drop-off" value={quote.dropoffPoint} />
              <DetailRow label="Distance" value={`${quote.estimatedDistanceKm} km`} />
              <DetailRow label="Drop-offs" value={String(quote.numberOfDropoffs)} />
            </div>
          </div>

          {/* Truck & crew + billing */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
            <div style={sectionTitle}>Truck, Crew & Billing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <DetailRow label="Truck Type" value={truckType?.label ?? "—"} />
              <DetailRow label="Helpers" value={String(quote.numberOfHelpers)} />
              <DetailRow
                label="Billing Type"
                value={quote.tripBillingType === "EIGHT_HOUR" ? "Per 8 Hours" : "Per Trip"}
              />
              <DetailRow label="Est. Hours" value={`${quote.estimatedHours ?? "—"} hrs`} />
            </div>
          </div>

          {/* Service flags — only show what's actually selected; hide the section entirely if none. */}
          {(() => {
            const activeFlags = [
              quote.condoService && "Condo Service",
              quote.cateringService && "Catering",
              quote.additionalHelper && "Additional Helper",
              pricing.isLongDistance && `Long Distance (≥ ${pricing.ratesSnapshot?.longDistanceThresholdKm ?? 50}km)`,
            ].filter((f): f is string => Boolean(f));
            if (activeFlags.length === 0) return null;
            return (
              <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
                <div style={sectionTitle}>Service Flags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {activeFlags.map((label) => (
                    <span
                      key={label}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: "var(--maroon-tint)",
                        color: "var(--maroon)",
                        border: "1px solid var(--maroon)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {quote.booking && (
            <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Converted to Booking</div>
                <div style={{ fontWeight: 600, marginTop: 2, fontFamily: "var(--font-mono)" }}>{quote.booking.bookingNo}</div>
              </div>
              <Link
                href={`/bookings/${quote.booking.id}`}
                style={{ fontSize: 13, color: "var(--maroon)", textDecoration: "none" }}
              >
                View Booking →
              </Link>
            </div>
          )}

          <ClientMessageDrafter
            clientName={quote.client?.clientName ?? quote.walkInName ?? "Client"}
            quoteNo={quote.quoteNo}
            serviceType={quote.serviceType}
            pickupPoint={quote.pickupPoint}
            dropoffPoint={quote.dropoffPoint}
            amount={quote.finalPrice.toNumber()}
            vatOption={quote.vatOption}
          />
        </div>

        {/* Right: pricing snapshot */}
        <div style={{ position: "sticky", top: 72 }}>
          <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Price Breakdown</div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--maroon-tint)", color: "var(--maroon)", padding: "3px 8px", borderRadius: 4 }}>
                Snapshot
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <tbody>
                  <Row label="Fuel" amount={pricing.fuelCost} />
                  <Row label="Trip base" amount={pricing.tripBase} />
                  {pricing.distanceCharge > 0 && <Row label="Distance charge" amount={pricing.distanceCharge} />}
                  {pricing.otherDirectCosts.loadingUnloadingFee > 0 && (
                    <Row label="Loading / unloading" amount={pricing.otherDirectCosts.loadingUnloadingFee} />
                  )}
                  {pricing.otherDirectCosts.condoFee > 0 && (
                    <Row label="Condo handling" amount={pricing.otherDirectCosts.condoFee} />
                  )}
                  {pricing.otherDirectCosts.cateringFee > 0 && (
                    <Row label="Catering handling" amount={pricing.otherDirectCosts.cateringFee} />
                  )}
                  {pricing.otherDirectCosts.additionalHelperFee > 0 && (
                    <Row label="Additional helper" amount={pricing.otherDirectCosts.additionalHelperFee} />
                  )}
                  {pricing.otherDirectCosts.excessHoursFee > 0 && (
                    <Row label="Excess hours" amount={pricing.otherDirectCosts.excessHoursFee} />
                  )}
                  {pricing.otherDirectCosts.extraDropoffsFee > 0 && (
                    <Row label="Extra drop-offs" amount={pricing.otherDirectCosts.extraDropoffsFee} />
                  )}
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "8px 0 4px", fontWeight: 600 }}>Base Costs</td>
                    <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.baseCosts)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--surface)", borderRadius: 6, fontSize: 11 }}>
                <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
                  Revenue allocations ({(pricing.markupRate * 100).toFixed(1)}% markup)
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                  <tbody>
                    <Row label="Driver" amount={pricing.allocations.driver} muted />
                    <Row label="Helper" amount={pricing.allocations.helper} muted />
                    <Row label="Overhead" amount={pricing.allocations.overhead} muted />
                    {pricing.isLongDistance && (
                      <Row label="Long-distance" amount={pricing.allocations.longDistance} muted />
                    )}
                  </tbody>
                </table>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 12 }}>
                <tbody>
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "8px 0 4px", fontWeight: 600 }}>Revenue (net of VAT)</td>
                    <td style={{ padding: "8px 0 4px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.revenueNetOfVat)}
                    </td>
                  </tr>
                  {pricing.discountAmount > 0 && <Row label="Discount" amount={-pricing.discountAmount} muted />}
                  {pricing.vatAmount > 0 && (
                    <Row
                      label={`VAT (${pricing.vatOption === "VAT_INCLUSIVE" ? "inclusive" : "exclusive"}, 12%)`}
                      amount={pricing.vatAmount}
                      muted
                    />
                  )}
                  {pricing.tollFee > 0 && (
                    <Row label="Toll" amount={pricing.tollFee} muted />
                  )}
                  {hasOverride && (
                    <tr>
                      <td style={{ padding: "8px 0 4px", color: "var(--muted)", textDecoration: "line-through" }}>Computed Quote</td>
                      <td style={{ padding: "8px 0 4px", textAlign: "right", color: "var(--muted)", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(pricing.computedFinalPrice)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "10px 0 0", fontWeight: 700, fontSize: 15 }}>
                      {hasOverride ? "Final (Override)" : "Final Quote"}
                    </td>
                    <td style={{ padding: "10px 0 0", textAlign: "right", fontWeight: 700, fontSize: 15, color: "var(--maroon)", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(pricing.finalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 6, fontSize: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                Snapshot computed {new Date(pricing.computedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                {quote.createdBy && (
                  <>
                    <br />
                    By <strong>{quote.createdBy.username}</strong>
                  </>
                )}
              </div>
            </div>
          </div>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 16,
};
