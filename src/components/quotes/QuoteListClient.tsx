"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";

interface QuoteSummary {
  id: string;
  quoteNo: string;
  status: string;
  clientName: string;
  finalPrice: number;
  createdAt: string;
  createdBy: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "var(--bg)", color: "var(--muted)" },
  SENT: { bg: "var(--maroon-tint)", color: "var(--maroon)" },
  ACCEPTED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  EXPIRED: { bg: "#f3f4f6", color: "#6b7280" },
};

export function QuoteListClient({ quotes }: { quotes: QuoteSummary[] }) {
  return (
    <div>
      <PageHeader title="Quotes" subtitle={`${quotes.length} quotation${quotes.length !== 1 ? "s" : ""}`}>
        <Link
          href="/quotes/new"
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
          + New Quote
        </Link>
      </PageHeader>

      {quotes.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          No quotes yet.{" "}
          <Link href="/quotes/new" style={{ color: "var(--maroon)", textDecoration: "none" }}>
            Create the first one →
          </Link>
        </div>
      ) : (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Quote No.", "Client", "Status", "Amount", "Date", "By", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const style = STATUS_STYLES[q.status] ?? STATUS_STYLES.DRAFT;
                return (
                  <tr key={q.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                      {q.quoteNo}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{q.clientName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.color}`,
                        }}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(q.finalPrice)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                      {formatDate(q.createdAt)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>{q.createdBy}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link
                        href={`/quotes/${q.id}`}
                        style={{ color: "var(--maroon)", fontSize: 12, textDecoration: "none", fontWeight: 500 }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
