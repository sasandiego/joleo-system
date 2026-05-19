import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PricingResult } from "@/features/pricing/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "40pt 48pt",
    color: "#1a1a1a",
  },
  header: {
    borderBottom: "2pt solid #6b1924",
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brandMark: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#6b1924",
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 8,
    color: "#888",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  quoteTitle: {
    textAlign: "right",
  },
  quoteTitleText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#6b1924",
  },
  quoteNo: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6b1924",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "0.5pt solid #e0e0e0",
  },
  grid2: {
    flexDirection: "row",
    gap: 16,
  },
  gridCell: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: "#888",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  tableRowSubtotal: {
    flexDirection: "row",
    paddingVertical: 5,
    borderTop: "1pt solid #e0e0e0",
    marginTop: 2,
  },
  tableRowTotal: {
    flexDirection: "row",
    paddingVertical: 6,
    borderTop: "2pt solid #6b1924",
    marginTop: 4,
  },
  tableLabel: {
    flex: 1,
    fontSize: 9.5,
  },
  tableLabelBold: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  tableAmount: {
    fontSize: 9.5,
    textAlign: "right",
    width: 80,
  },
  tableAmountBold: {
    fontSize: 10,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    width: 80,
  },
  tableAmountTotal: {
    fontSize: 11,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: "#6b1924",
    width: 80,
  },
  tierRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  tierCard: {
    flex: 1,
    border: "0.5pt solid #e0e0e0",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  tierCardSelected: {
    flex: 1,
    border: "1pt solid #6b1924",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#fdf2f2",
  },
  tierLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#888",
    marginBottom: 3,
  },
  tierLabelSelected: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6b1924",
    marginBottom: 3,
  },
  tierValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  tierValueSelected: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#6b1924",
  },
  muted: {
    color: "#888",
  },
  footer: {
    position: "absolute",
    bottom: 30,
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

function formatPhp(amount: number): string {
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
  status,
  clientName,
  serviceType,
  pickupPoint,
  dropoffPoint,
  pricing,
  createdAt,
  createdBy,
}: QuotationPDFProps) {
  const nonZeroItems = pricing.lineItems.filter((li) => li.amount !== 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandMark}>Joleo</Text>
            <Text style={styles.brandSub}>Transport · Caloocan City</Text>
          </View>
          <View style={styles.quoteTitle}>
            <Text style={styles.quoteTitleText}>QUOTATION</Text>
            <Text style={styles.quoteNo}>{quoteNo} · {status}</Text>
            <Text style={styles.quoteNo}>{createdAt}</Text>
          </View>
        </View>

        {/* Client & job info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.grid2}>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Client</Text>
              <Text style={styles.fieldValue}>{clientName}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <Text style={styles.fieldValue}>{serviceType.replace(/_/g, " ")}</Text>
            </View>
          </View>
          <View style={[styles.grid2, { marginTop: 10 }]}>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Pick-up Point</Text>
              <Text style={styles.fieldValue}>{pickupPoint}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Drop-off Point</Text>
              <Text style={styles.fieldValue}>{dropoffPoint}</Text>
            </View>
          </View>
        </View>

        {/* Price computation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Computation</Text>
          <View style={styles.table}>
            {nonZeroItems.map((li) => (
              <View key={li.code} style={styles.tableRow}>
                <Text style={styles.tableLabel}>{li.label}</Text>
                <Text style={styles.tableAmount}>{formatPhp(li.amount)}</Text>
              </View>
            ))}
            <View style={styles.tableRowSubtotal}>
              <Text style={styles.tableLabelBold}>Direct Cost Subtotal</Text>
              <Text style={styles.tableAmountBold}>{formatPhp(pricing.directCostSubtotal)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, styles.muted]}>Overhead Allocation</Text>
              <Text style={[styles.tableAmount, styles.muted]}>{formatPhp(pricing.overheadAllocation)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, styles.muted]}>Contingency Buffer</Text>
              <Text style={[styles.tableAmount, styles.muted]}>{formatPhp(pricing.contingencyBuffer)}</Text>
            </View>
            <View style={styles.tableRowSubtotal}>
              <Text style={styles.tableLabelBold}>Total Cost Before Profit</Text>
              <Text style={styles.tableAmountBold}>{formatPhp(pricing.totalCostBeforeProfit)}</Text>
            </View>
          </View>

          {/* Tier grid */}
          <View style={styles.tierRow}>
            {[
              { label: "Floor", value: pricing.floorPrice, selected: false },
              { label: "Target", value: pricing.targetPrice, selected: true },
              { label: "Ceiling", value: pricing.ceilingPrice, selected: false },
            ].map(({ label, value, selected }) => (
              <View key={label} style={selected ? styles.tierCardSelected : styles.tierCard}>
                <Text style={selected ? styles.tierLabelSelected : styles.tierLabel}>{label}</Text>
                <Text style={selected ? styles.tierValueSelected : styles.tierValue}>{formatPhp(value)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.table}>
            {pricing.discountAmount > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, styles.muted]}>Discount</Text>
                <Text style={[styles.tableAmount, styles.muted]}>−{formatPhp(pricing.discountAmount)}</Text>
              </View>
            )}
            {pricing.vatAmount > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, styles.muted]}>
                  VAT ({pricing.inputsSnapshot.vatOption.replace(/_/g, " ")})
                </Text>
                <Text style={[styles.tableAmount, styles.muted]}>{formatPhp(pricing.vatAmount)}</Text>
              </View>
            )}
            <View style={styles.tableRowTotal}>
              <Text style={styles.tableLabelBold}>Final Quoted Price</Text>
              <Text style={styles.tableAmountTotal}>{formatPhp(pricing.finalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Joleo Transport · Caloocan City</Text>
          <Text style={styles.footerText}>Prepared by: {createdBy}</Text>
          <Text style={styles.footerText}>This quotation is valid for 7 days.</Text>
        </View>
      </Page>
    </Document>
  );
}
