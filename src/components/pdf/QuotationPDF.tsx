import React from "react";
import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { PricingResult } from "@/features/pricing/types";

// DejaVu Sans Regular includes U+20B1 (₱). Bold does not, so amount
// strings always use Regular weight; labels/headings use Bold.
Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.resolve(process.cwd(), "public/fonts/DejaVuSans.ttf") },
    { src: path.resolve(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: 700 },
  ],
});

const BRAND = "#6b1924";
const MUTED = "#888888";

const s = StyleSheet.create({
  page: {
    fontFamily: "DejaVu",
    fontSize: 9,
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 40,
    color: "#1a1a1a",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2pt solid #6b1924",
    paddingBottom: 8,
    marginBottom: 14,
  },
  brandMark: { fontSize: 20, fontWeight: 700, color: BRAND },
  brandSub: { fontSize: 7, color: MUTED, letterSpacing: 2, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  quotationLabel: { fontSize: 12, fontWeight: 700, color: BRAND },
  quoteNo: { fontSize: 8, color: MUTED, marginTop: 2 },

  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: BRAND,
    textTransform: "uppercase",
    borderBottom: "0.5pt solid #6b1924",
    paddingBottom: 3,
    marginBottom: 6,
  },

  gridRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #f0f0f0",
    paddingVertical: 3,
  },
  gridCell: { flex: 1, paddingRight: 8 },
  gridCellRight: { flex: 1, paddingLeft: 8, borderLeft: "0.5pt solid #f0f0f0" },
  detailLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 1 },
  detailValue: { fontSize: 9 },

  bulletGrid: { flexDirection: "row", flexWrap: "wrap" },
  bulletItem: { width: "50%", fontSize: 8.5, paddingVertical: 2 },

  priceRow: { flexDirection: "row", paddingVertical: 3.5 },
  priceRowMuted: { flexDirection: "row", paddingVertical: 2.5 },
  priceLabel: { flex: 1, fontSize: 9 },
  priceLabelMuted: { flex: 1, fontSize: 8.5, color: MUTED },
  priceValue: { fontSize: 9, textAlign: "right", minWidth: 90 },
  priceValueMuted: { fontSize: 8.5, color: MUTED, textAlign: "right", minWidth: 90 },
  priceDivider: { borderTop: "1.5pt solid #6b1924", marginTop: 5, marginBottom: 3 },
  totalRow: { flexDirection: "row", paddingTop: 4 },
  totalLabel: { flex: 1, fontSize: 10.5, fontWeight: 700 },
  totalValue: { fontSize: 14, color: BRAND, textAlign: "right", minWidth: 90 },

  serviceDesc: { fontSize: 8.5, color: "#333333", lineHeight: 1.5, marginBottom: 10 },

  termsTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  termsText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    borderTop: "0.5pt solid #e0e0e0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#aaa" },
});

function fmt(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function vatLabel(opt: string): string {
  if (opt === "VAT_INCLUSIVE") return "VAT Inclusive";
  if (opt === "VAT_EXCLUSIVE") return "VAT Exclusive";
  return "Non-VAT";
}

function billingLabel(bt: string): string {
  return bt === "EIGHT_HOUR" ? "Per 8-Hour Service" : "Per-Trip Flat Rate";
}

interface QuotationPDFProps {
  quoteNo: string;
  status: string;
  clientName: string;
  contactPerson: string | null;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  truckType: string | null;
  numberOfHelpers: number;
  pricing: PricingResult;
  createdAt: string;
  createdBy: string;
  serviceDescription?: string | null;
}

export function QuotationPDF({
  quoteNo,
  clientName,
  contactPerson,
  serviceType,
  pickupPoint,
  dropoffPoint,
  scheduledDate,
  scheduledStartTime,
  truckType,
  numberOfHelpers,
  pricing,
  createdAt,
  createdBy,
  serviceDescription,
}: QuotationPDFProps) {
  const { inputsSnapshot: inp } = pricing;
  const vatOpt = inp.vatOption;

  // Use effective values (back-computed if override is set) for BIR-compliant receipt
  const effectiveVat = pricing.effectiveVatAmount;
  const effectiveRevenue = pricing.effectiveRevenueNetOfVat;
  const tollAmt = pricing.tollFee;
  const finalPrice = pricing.finalPrice;

  // Service fee (what client effectively pays for trucking, excludes toll)
  // For display, we show: net + VAT separately (or just total inclusive)
  const serviceFeeBeforeVat = effectiveRevenue; // net of VAT

  const inclusions: string[] = [
    truckType ? `Truck: ${truckType}` : "Transport Truck",
    "1 Driver (standard shift)",
    `${numberOfHelpers} Helper${numberOfHelpers !== 1 ? "s" : ""}`,
    `Billing: ${billingLabel(inp.tripBillingType)}`,
    "Loading & Unloading",
  ];
  if (inp.condoService) inclusions.push("Condominium Handling");
  if (inp.cateringService) inclusions.push("Catering Handling");
  if (pricing.isLongDistance) inclusions.push("Long-Distance Coverage");
  if (inp.additionalHelper) inclusions.push("Additional Helper");
  if (inp.numberOfDropoffs > 1) inclusions.push(`${inp.numberOfDropoffs} Drop-off Points`);

  const exclusions: string[] = [
    "Parking fees (paid by client at venue)",
    "Condo / mall gate passes",
    "Packing and unpacking of items",
    "Disassembly / reassembly of furniture",
    "Fragile, hazardous, or prohibited goods",
    "Insurance / liability for goods in transit",
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <View>
            <Text style={s.brandMark}>Joleo</Text>
            <Text style={s.brandSub}>TRANSPORT · CALOOCAN CITY</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.quotationLabel}>QUOTATION</Text>
            <Text style={s.quoteNo}>{quoteNo}</Text>
            <Text style={s.quoteNo}>{createdAt}</Text>
          </View>
        </View>

        {serviceDescription ? <Text style={s.serviceDesc}>{serviceDescription}</Text> : null}

        {/* ── Client & Booking Details ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Client & Booking Details</Text>
          {([
            ["Quotation Date",  createdAt,                  "Service Type",       serviceType.replace(/_/g, " ")],
            ["Scheduled Date",  scheduledDate ?? "—",       "Scheduled Start",    scheduledStartTime ?? "—"],
            ["Client Name",     clientName,                 "Pick-up Point",      pickupPoint],
            ["Contact Person",  contactPerson ?? "—",       "Drop-off Point",     dropoffPoint],
            ["Est. Distance",   `${inp.estimatedDistanceKm} km`, "Drop-offs",     String(inp.numberOfDropoffs)],
          ] as [string, string, string, string][]).map(([l1, v1, l2, v2]) => (
            <View key={l1} style={s.gridRow}>
              <View style={s.gridCell}>
                <Text style={s.detailLabel}>{l1}</Text>
                <Text style={s.detailValue}>{v1}</Text>
              </View>
              <View style={s.gridCellRight}>
                <Text style={s.detailLabel}>{l2}</Text>
                <Text style={s.detailValue}>{v2}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Truck & Crew ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Truck & Crew</Text>
          {([
            ["Truck Selected", truckType ?? "—", "Driver", "1 driver included (assigned at booking)"],
            ["Helpers", `${numberOfHelpers} helper${numberOfHelpers !== 1 ? "s" : ""}`, "Billing Type", billingLabel(inp.tripBillingType)],
          ] as [string, string, string, string][]).map(([l1, v1, l2, v2]) => (
            <View key={l1} style={s.gridRow}>
              <View style={s.gridCell}>
                <Text style={s.detailLabel}>{l1}</Text>
                <Text style={s.detailValue}>{v1}</Text>
              </View>
              <View style={s.gridCellRight}>
                <Text style={s.detailLabel}>{l2}</Text>
                <Text style={s.detailValue}>{v2}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Service Inclusions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Service Inclusions</Text>
          <View style={s.bulletGrid}>
            {inclusions.map((item) => (
              <Text key={item} style={s.bulletItem}>{"✓  "}{item}</Text>
            ))}
          </View>
        </View>

        {/* ── Exclusions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Exclusions</Text>
          <View style={s.bulletGrid}>
            {exclusions.map((item) => (
              <Text key={item} style={s.bulletItem}>{"✕  "}{item}</Text>
            ))}
          </View>
        </View>

        {/* ── Pricing Summary ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pricing Summary</Text>

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Trucking Service Fee</Text>
            <Text style={s.priceValue}>{fmt(serviceFeeBeforeVat)}</Text>
          </View>

          {tollAmt > 0 && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Toll</Text>
              <Text style={s.priceValue}>{fmt(tollAmt)}</Text>
            </View>
          )}

          <View style={s.priceRowMuted}>
            <Text style={s.priceLabelMuted}>VAT ({vatLabel(vatOpt)})</Text>
            <Text style={s.priceValueMuted}>{vatOpt === "NON_VAT" ? "—" : fmt(effectiveVat)}</Text>
          </View>

          <View style={s.priceDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>GRAND TOTAL</Text>
            <Text style={s.totalValue}>{fmt(finalPrice)}</Text>
          </View>
        </View>

        {/* ── Terms ── */}
        <View>
          <Text style={s.termsTitle}>Terms & Conditions</Text>
          <Text style={s.termsText}>
            {"•  "}This quotation is valid for 7 days from date of issue.{"\n"}
            {"•  "}Parking fees, condo and mall gate passes are paid directly by the client.{"\n"}
            {"•  "}Toll fees shown are pass-through estimates; actual amounts may vary by route.{"\n"}
            {"•  "}Excess hours beyond the included service window are billed at the applicable rate.{"\n"}
            {"•  "}Final booking is subject to truck and crew availability on the requested date.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Joleo Transport · Caloocan City</Text>
          <Text style={s.footerText}>Prepared by: {createdBy}</Text>
          <Text style={s.footerText}>Thank you for your business.</Text>
        </View>

      </Page>
    </Document>
  );
}
