import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { PricingResult } from "@/features/pricing/types";

// DejaVu Sans Regular includes U+20B1 (₱). Bold does not, so amount
// strings always use Regular weight; section titles/labels use Bold.
Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.resolve(process.cwd(), "public/fonts/DejaVuSans.ttf") },
    { src: path.resolve(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: 700 },
  ],
});

const BRAND = "#6b1924";
const MUTED = "#888888";
const BORDER = "#e0e0e0";

const s = StyleSheet.create({
  page: {
    fontFamily: "DejaVu",
    fontSize: 9.5,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 44,
    color: "#1a1a1a",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2pt solid #6b1924",
    paddingBottom: 10,
    marginBottom: 18,
  },
  brandMark: { fontSize: 22, fontWeight: 700, color: BRAND },
  brandSub: { fontSize: 7.5, color: MUTED, letterSpacing: 2, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  quotationLabel: { fontSize: 13, fontWeight: 700, color: BRAND },
  quoteNo: { fontSize: 8.5, color: MUTED, marginTop: 2 },

  // ── Section chrome ────────────────────────────────────────────────────────
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: BRAND,
    textTransform: "uppercase",
    borderBottom: "0.5pt solid #6b1924",
    paddingBottom: 3,
    marginBottom: 8,
  },

  // ── Detail rows (label | value) ───────────────────────────────────────────
  detailRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    borderBottom: "0.5pt solid #f0f0f0",
  },
  detailLabel: {
    width: "38%",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: { flex: 1, fontSize: 9.5 },

  // ── Bullet list ───────────────────────────────────────────────────────────
  bulletGrid: { flexDirection: "row", flexWrap: "wrap" },
  bulletItem: { width: "50%", fontSize: 9, paddingVertical: 2.5 },
  bulletItemFull: { width: "100%", fontSize: 9, paddingVertical: 2.5 },

  // ── Pricing summary ───────────────────────────────────────────────────────
  priceRow: { flexDirection: "row", paddingVertical: 4 },
  priceRowMuted: { flexDirection: "row", paddingVertical: 3 },
  priceLabel: { flex: 1, fontSize: 9.5 },
  priceLabelMuted: { flex: 1, fontSize: 9, color: MUTED },
  priceValue: { fontSize: 9.5, textAlign: "right", minWidth: 95 },
  priceValueMuted: { fontSize: 9, color: MUTED, textAlign: "right", minWidth: 95 },
  priceDivider: { borderTop: "2pt solid #6b1924", marginTop: 6, marginBottom: 4 },
  totalRow: { flexDirection: "row", paddingTop: 5 },
  totalLabel: { flex: 1, fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 15, color: BRAND, textAlign: "right", minWidth: 95 },

  // ── Terms ─────────────────────────────────────────────────────────────────
  termsTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  termsText: { fontSize: 8.5, color: MUTED, lineHeight: 1.6 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTop: "0.5pt solid #e0e0e0",
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#aaa" },
});

function fmt(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function vatLabel(opt: string): string {
  if (opt === "VAT_INCLUSIVE") return "VAT Inclusive";
  if (opt === "VAT_EXCLUSIVE") return "VAT Exclusive";
  return "Non-VAT";
}

interface QuotationPDFProps {
  quoteNo: string;
  status: string;
  clientName: string;
  contactPerson: string | null;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  routeArea: string | null;
  truckType: string | null;
  pricing: PricingResult;
  createdAt: string;
  createdBy: string;
}

export function QuotationPDF({
  quoteNo,
  clientName,
  contactPerson,
  serviceType,
  pickupPoint,
  dropoffPoint,
  routeArea,
  truckType,
  pricing,
  createdAt,
  createdBy,
}: QuotationPDFProps) {
  const { inputsSnapshot: inp, finalPrice, vatAmount } = pricing;
  const tollAmt =
    pricing.lineItems.find((li) => li.code === "TOLL_AND_PARKING")?.amount ?? 0;
  const vatOpt = inp.vatOption;

  // serviceCharge + tollAmt [+ vatAmount if EXCLUSIVE] = finalPrice
  const serviceCharge =
    vatOpt === "VAT_EXCLUSIVE" ? finalPrice - vatAmount - tollAmt : finalPrice - tollAmt;

  // ── Service inclusions ─────────────────────────────────────────────────
  const inclusions: string[] = [
    truckType ? `Truck: ${truckType}` : "Transport Truck",
    "1 Driver (standard shift)",
    `${inp.numberOfHelpers} Helper${inp.numberOfHelpers !== 1 ? "s" : ""}`,
    `${inp.includedHours}-Hour Service Window`,
    "Loading & Unloading",
  ];
  if (inp.condoService) inclusions.push("Condominium Handling");
  if (inp.cateringService) inclusions.push("Catering Handling");
  if (inp.nightDelivery) inclusions.push("Night Delivery");
  if (inp.outOfTown) inclusions.push("Out-of-Town Service");
  if (inp.longDistance) inclusions.push("Long-Distance Transport");
  if (inp.additionalHelper) inclusions.push("Additional Helper");
  if (inp.numberOfDropoffs > 1) inclusions.push(`${inp.numberOfDropoffs} Drop-off Points`);

  // ── Exclusions ─────────────────────────────────────────────────────────
  const exclusions: string[] = [
    `Excess hours beyond ${inp.includedHours} included hours (charged separately)`,
    "Packing and unpacking of items",
    "Disassembly and reassembly of furniture",
    "Fragile, hazardous, or prohibited goods",
    "Insurance or liability coverage for goods in transit",
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
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

        {/* ── Client & Booking Details ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Client & Booking Details</Text>
          {[
            ["Quotation Date", createdAt],
            ["Client Name", clientName],
            ["Contact Person", contactPerson ?? "—"],
            ["Service Type", serviceType.replace(/_/g, " ")],
            ["Pick-up Point", pickupPoint],
            ["Drop-off Point", dropoffPoint],
            ["Route / Area", routeArea ?? "—"],
            ["Est. Distance", `${inp.estimatedDistanceKm} km`],
          ].map(([label, value]) => (
            <View key={label} style={s.detailRow}>
              <Text style={s.detailLabel}>{label}</Text>
              <Text style={s.detailValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Truck & Crew ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Truck & Crew</Text>
          {[
            ["Truck Selected", truckType ?? "—"],
            ["Driver", "1 driver included (assigned at booking)"],
            ["Helpers", `${inp.numberOfHelpers} helper${inp.numberOfHelpers !== 1 ? "s" : ""}`],
            ["Included Hours", `${inp.includedHours} hrs`],
          ].map(([label, value]) => (
            <View key={label} style={s.detailRow}>
              <Text style={s.detailLabel}>{label}</Text>
              <Text style={s.detailValue}>{value}</Text>
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
          {exclusions.map((item) => (
            <Text key={item} style={s.bulletItemFull}>{"✕  "}{item}</Text>
          ))}
        </View>

        {/* ── Pricing Summary ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pricing Summary</Text>

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>
              Service Fee{vatOpt === "VAT_INCLUSIVE" ? " (incl. VAT)" : vatOpt === "VAT_EXCLUSIVE" ? " (ex-VAT)" : ""}
            </Text>
            <Text style={s.priceValue}>{fmt(serviceCharge)}</Text>
          </View>

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Toll & Parking</Text>
            <Text style={s.priceValue}>{fmt(tollAmt)}</Text>
          </View>

          <View style={s.priceRowMuted}>
            <Text style={s.priceLabelMuted}>VAT Option</Text>
            <Text style={s.priceValueMuted}>{vatLabel(vatOpt)}</Text>
          </View>

          <View style={s.priceRowMuted}>
            <Text style={s.priceLabelMuted}>
              VAT Amount{vatOpt === "VAT_INCLUSIVE" ? " (included)" : vatOpt === "VAT_EXCLUSIVE" ? " (12%)" : ""}
            </Text>
            <Text style={s.priceValueMuted}>
              {vatOpt === "NON_VAT" ? "—" : fmt(vatAmount)}
            </Text>
          </View>

          <View style={s.priceDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL COST</Text>
            <Text style={s.totalValue}>{fmt(finalPrice)}</Text>
          </View>
        </View>

        {/* ── Terms & Conditions ── */}
        <View style={{ marginTop: 4 }}>
          <Text style={s.termsTitle}>Terms & Conditions</Text>
          <Text style={s.termsText}>
            {"•  "}This quotation is valid for 7 days from date of issue.{"\n"}
            {"•  "}Prices are subject to change after the validity period.{"\n"}
            {"•  "}Toll and parking fees are pass-through costs subject to actual charges on the day of service.{"\n"}
            {"•  "}Final booking is subject to truck and crew availability.{"\n"}
            {"•  "}Excess hours are billed at the applicable overtime rate.
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Joleo Transport · Caloocan City</Text>
          <Text style={s.footerText}>Prepared by: {createdBy}</Text>
          <Text style={s.footerText}>Thank you for your business.</Text>
        </View>

      </Page>
    </Document>
  );
}
