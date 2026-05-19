"use client";

import { useState } from "react";
import { ClientDialog } from "./ClientDialog";
import { ToggleClientButton } from "./ToggleClientButton";

interface Client {
  id: string;
  companyName: string;
  contactPerson: string | null;
  mobile: string | null;
  email: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
}

interface ClientListClientProps {
  clients: Client[];
}

type StatusFilter = "all" | "active" | "inactive";

export function ClientListClient({ clients }: ClientListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 13.5,
    padding: "9px 12px",
    border: "1px solid var(--border-strong)",
    borderRadius: 6,
    background: "white",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 24,
          marginBottom: 28,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Clients
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ClientDialog mode="add" />
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
              fontSize: 15,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by company or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36, width: "100%" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={{ ...inputStyle, width: "auto", minWidth: 140 }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table card */}
      <div
        style={{
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Company Name", "Contact Person", "Mobile", "Payment Terms", "Status", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "12px 24px",
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "32px 24px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  {search || statusFilter !== "all"
                    ? "No clients match your filters."
                    : "No clients found."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id}>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink)",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 500,
                    }}
                  >
                    {client.companyName}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {client.contactPerson ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {client.mobile ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {client.paymentTerms ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "var(--maroon-tint)",
                          color: "var(--maroon)",
                        }}
                      >
                        {client.paymentTerms}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {client.isActive ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "#E8F5EC",
                          color: "var(--success)",
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
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
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <ClientDialog mode="edit" client={client} />
                      <ToggleClientButton clientId={client.id} isActive={client.isActive} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
