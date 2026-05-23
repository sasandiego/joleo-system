import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ClientDialog } from "@/components/clients/ClientDialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const [client, quotes] = await Promise.all([
    db.client.findUnique({ where: { id } }),
    db.quote.findMany({
      where: { clientId: id },
      orderBy: { quotedAt: "desc" },
      select: {
        id: true,
        quoteNo: true,
        status: true,
        quotedAt: true,
        finalPrice: true,
        serviceType: true,
        pickupPoint: true,
        dropoffPoint: true,
      },
    }),
  ]);

  if (!client) notFound();

  const cell: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "14px 0",
    borderBottom: "1px solid var(--border)",
  };
  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--muted)",
  };
  const value: React.CSSProperties = {
    fontSize: 14,
    color: "var(--ink)",
  };
  const emptyValue: React.CSSProperties = {
    fontSize: 14,
    color: "var(--muted)",
    fontStyle: "italic",
  };

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: "#F0EFEC", color: "var(--ink-soft)" },
    SENT: { bg: "#EEF2FF", color: "#4338CA" },
    ACCEPTED: { bg: "#E8F5EC", color: "var(--success)" },
    REJECTED: { bg: "#FBEAE7", color: "var(--danger)" },
    EXPIRED: { bg: "#F0EFEC", color: "var(--ink-soft)" },
    QUOTED: { bg: "#EEF2FF", color: "#4338CA" },
    CONFIRMED: { bg: "#E8F5EC", color: "var(--success)" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: 24,
          marginBottom: 32,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {client.clientCode && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}
              >
                {client.clientCode}
              </span>
            )}
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background:
                  client.type === "CORPORATION_BUSINESS" ? "var(--maroon-tint)"
                  : client.type === "INDIVIDUAL_BUSINESS" ? "#EEF2FF"
                  : "#F3F4F6",
                color:
                  client.type === "CORPORATION_BUSINESS" ? "var(--maroon)"
                  : client.type === "INDIVIDUAL_BUSINESS" ? "#4338CA"
                  : "#6B7280",
              }}
            >
              {client.type === "CORPORATION_BUSINESS" ? "Corporation"
                : client.type === "INDIVIDUAL_BUSINESS" ? "Individual Business"
                : "Individual Person"}
            </span>
            {!client.isActive && (
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#F0EFEC",
                  color: "var(--ink-soft)",
                }}
              >
                Inactive
              </span>
            )}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {client.clientName}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <Link
            href="/clients"
            style={{
              background: "transparent",
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13,
              color: "var(--ink)",
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            ← Back
          </Link>
          <ClientDialog mode="edit" client={client} />
        </div>
      </div>

      {/* Info grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 48px",
          marginBottom: 40,
        }}
      >
        {/* Left column */}
        <div>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
            Contact
          </h2>

          <div style={cell}>
            <span style={label}>Contact Person</span>
            {client.contactPerson
              ? <span style={value}>{client.contactPerson}</span>
              : <span style={emptyValue}>—</span>}
          </div>

          <div style={cell}>
            <span style={label}>Mobile</span>
            {client.mobile
              ? <span style={{ ...value, fontFamily: "var(--font-mono)" }}>{client.mobile}</span>
              : <span style={emptyValue}>—</span>}
          </div>

          <div style={cell}>
            <span style={label}>Landline</span>
            {client.landline
              ? <span style={{ ...value, fontFamily: "var(--font-mono)" }}>{client.landline}</span>
              : <span style={emptyValue}>—</span>}
          </div>

          <div style={{ ...cell, borderBottom: "none" }}>
            <span style={label}>Email</span>
            {client.email
              ? <a href={`mailto:${client.email}`} style={{ ...value, color: "var(--maroon)", textDecoration: "none" }}>{client.email}</a>
              : <span style={emptyValue}>—</span>}
          </div>
        </div>

        {/* Right column */}
        <div>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
            Business / Official Receipt
          </h2>

          <div style={cell}>
            <span style={label}>TIN</span>
            {client.tin
              ? <span style={{ ...value, fontFamily: "var(--font-mono)" }}>{client.tin}</span>
              : <span style={emptyValue}>—</span>}
          </div>

          <div style={cell}>
            <span style={label}>
              {client.type === "INDIVIDUAL_PERSON" ? "Address"
                : client.type === "INDIVIDUAL_BUSINESS" ? "Business Address"
                : "Registered Address"}
            </span>
            {client.address
              ? <span style={{ ...value, lineHeight: 1.5 }}>{client.address}</span>
              : <span style={emptyValue}>—</span>}
          </div>

          <div style={{ ...cell, borderBottom: "none" }}>
            <span style={label}>Payment Terms</span>
            {client.paymentTerms
              ? (
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "var(--maroon-tint)",
                    color: "var(--maroon)",
                    width: "fit-content",
                  }}
                >
                  {client.paymentTerms}
                </span>
              )
              : <span style={emptyValue}>—</span>}
          </div>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "14px 18px",
            marginBottom: 40,
          }}
        >
          <span style={{ ...label, display: "block", marginBottom: 6 }}>Notes</span>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>{client.notes}</p>
        </div>
      )}

      {/* Quotes */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Quotes
          </h2>
          <Link
            href={`/quotes/new?clientId=${client.id}`}
            style={{
              background: "var(--maroon)",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            + New Quote
          </Link>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {quotes.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No quotes yet for this client.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Quote No.", "Date", "Service", "Route", "Amount", "Status"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "12px 20px",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--muted)",
                        fontWeight: 600,
                        borderBottom: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const sc = STATUS_COLORS[q.status] ?? { bg: "#F0EFEC", color: "var(--ink-soft)" };
                  return (
                    <tr key={q.id}>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <Link href={`/quotes/${q.id}`} style={{ color: "var(--maroon)", textDecoration: "none", fontWeight: 600 }}>
                          {q.quoteNo}
                        </Link>
                      </td>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", color: "var(--ink-soft)" }}>
                        {formatDateTime(q.quotedAt)}
                      </td>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", color: "var(--ink-soft)" }}>
                        {q.serviceType.replace(/_/g, " ")}
                      </td>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", color: "var(--ink-soft)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.pickupPoint} → {q.dropoffPoint}
                      </td>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink)" }}>
                        {formatCurrency(q.finalPrice.toNumber())}
                      </td>
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
