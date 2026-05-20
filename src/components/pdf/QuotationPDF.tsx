import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { PricingResult } from "@/features/pricing/types";

// DejaVu Sans is used because it includes U+20B1 (₱) in the Regular weight.
// Bold weight lacks ₱, so all amount strings use fontFamily "DejaVu" without bold.
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

const styles = StyleSheet.create({
  page: {
    fontFamily: "DejaVu",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2pt solid #6b1924",
    paddingBottom: 12,
    marginBottom: 24,
  },
  brandMark: {
    fontSize: 24,
    fontWeight: 700,
    color: BRAND,
  },
  brandSub: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  quotationLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND,
  },
  quoteNo: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: BRAND,
    textTransform: "uppercase",
    borderBottom: "0.5pt solid #e0e0e0",
    paddingBottom: 4,
    marginBottom: 10,
  },
  row2: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  clientLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  chargeRow: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  chargeRowMuted: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  chargeLabel: {
    flex: 1,
    fontSize: 10,
  },
  chargeLabelMuted: {
    flex: 1,
    fontSize: 9.5,
    color: MUTED,
  },
  chargeAmount: {
    fontSize: 10,
    textAlign: "right",
    minWidth: 90,
  },
  chargeAmountMuted: {
    fontSize: 9.5,
    color: MUTED,
    textAlign: "right",
    minWidth: 90,
  },
  totalDivider: {
    borderTop: "2pt solid #6b1924",
    marginTop: 8,
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: "row",
    paddingTop: 6,
  },
  totalLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
  },
  totalAmount: {
    fontSize: 16,
    color: BRAND,
    textAlign: "right",
    minWidth: 90,
  },
  vatNote: {
    fontSize: 8,
    color: MUTED,
    marginTop: 6,
  },
  termsBox: {
    marginTop: 32,
    borderTop: "0.5pt solid #e0e0e0",
    paddingTop: 12,
  },
  termsTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  termsText: {
    fontSize: 8.5,
    color: MUTED,
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    borderTop: "0.5pt solid #e0e0e0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: "#aaa",
  },
});

function fmt(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface QuotationPDFProps {
  quoteNo: string;
  status: string;
  clientName: string;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  pricing: PricingResult;
  createdAt: string;
  createdBy: string;
}

export function QuotationPDF({
  quoteNo,
  clientName,
  serviceType,
  pickupPoint,
  dropoffPoint,
  pricing,
  createdAt,
  createdBy,
}: QuotationPDFProps) {
  const { inputsSnapshot: inputs, finalPrice, vatAmount } = pricing;
  const tollAmt =
    pricing.lineItems.find((li) => li.code === "TOLL_AND_PARKING")?.amount ?? 0;
  const vatOption = inputs.vatOption;

  // serviceCharge + tollAmt [+ vatAmount if EXCLUSIVE] = finalPrice
  const serviceCharge =
    vatOption === "VAT_EXCLUSIVE"
      ? finalPrice - vatAmount - tollAmt
      : finalPrice - tollAmt;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandMark}>Joleo</Text>
            <Text style={styles.brandSub}>TRANSPORT · CALOOCAN CITY</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quotationLabel}>QUOTATION</Text>
            <Text style={styles.quoteNo}>{quoteNo}</Text>
            <Text style={styles.quoteNo}>{createdAt}</Text>
          </View>
        </View>

        {/* Prepared For */}
        <View style={styles.section}>
          <Text style={styles.clientLabel}>Prepared For</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={[styles.row2, { marginBottom: 10 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <Text style={styles.fieldValue}>{serviceType.replace(/_/g, " ")}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Estimated Distance</Text>
              <Text style={styles.fieldValue}>{inputs.estimatedDistanceKm} km</Text>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Pick-up Point</Text>
              <Text style={styles.fieldValue}>{pickupPoint}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Drop-off Point</Text>
              <Text style={styles.fieldValue}>{dropoffPoint}</Text>
            </View>
          </View>
          {inputs.numberOfHelpers > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fieldLabel}>Helpers Included</Text>
              <Text style={styles.fieldValue}>
                {inputs.numberOfHelpers} helper{inputs.numberOfHelpers !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges</Text>

          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Service Fee</Text>
            <Text style={styles.chargeAmount}>{fmt(serviceCharge)}</Text>
          </View>

          {tollAmt > 0 && (
            <View style={styles.chargeRowMuted}>
              <Text style={styles.chargeLabelMuted}>Toll & Parking (pass-through)</Text>
              <Text style={styles.chargeAmountMuted}>{fmt(tollAmt)}</Text>
            </View>
          )}

          {vatOption === "VAT_EXCLUSIVE" && (
            <View style={styles.chargeRowMuted}>
              <Text style={styles.chargeLabelMuted}>VAT (12%)</Text>
              <Text style={styles.chargeAmountMuted}>{fmt(vatAmount)}</Text>
            </View>
          )}

          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount Due</Text>
            <Text style={styles.totalAmount}>{fmt(finalPrice)}</Text>
          </View>

          {vatOption === "VAT_INCLUSIVE" && (
            <Text style={styles.vatNote}>VAT (12%) is included in the total amount.</Text>
          )}
          {vatOption === "NON_VAT" && (
            <Text style={styles.vatNote}>No VAT applicable to this quotation.</Text>
          )}
        </View>

        {/* Terms */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            {"•"} This quotation is valid for 7 days from date of issue.{"\n"}
            {"•"} Prices are subject to change after the validity period.{"\n"}
            {"•"} Toll and parking fees are pass-through costs subject to actual charges.{"\n"}
            {"•"} Final booking is subject to truck and crew availability.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Joleo Transport · Caloocan City</Text>
          <Text style={styles.footerText}>Prepared by: {createdBy}</Text>
          <Text style={styles.footerText}>Thank you for your business.</Text>
        </View>
      </Page>
    </Document>
  );
}
