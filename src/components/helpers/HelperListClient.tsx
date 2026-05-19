"use client";

import { useState } from "react";
import { HelperDialog } from "./HelperDialog";

interface Helper {
  id: string;
  employeeId: string;
  fullName: string;
  dailyRate: number | string;
  otRate: number | string;
  status: string;
  remarks: string | null;
}

interface HelperListClientProps {
  helpers: Helper[];
}

export function HelperListClient({ helpers }: HelperListClientProps) {
  const [search, setSearch] = useState("");

  const filtered = helpers.filter(
    (h) =>
      h.fullName.toLowerCase().includes(search.toLowerCase()) ||
      h.employeeId.toLowerCase().includes(search.toLowerCase())
  );

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
            Helpers
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {helpers.length} helper{helpers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <HelperDialog mode="add" />
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
            placeholder="Search by name or employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontFamily: "inherit",
              fontSize: 13.5,
              padding: "9px 12px",
              paddingLeft: 36,
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              background: "white",
              color: "var(--ink)",
              width: "100%",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
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
              <th
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
                Employee ID
              </th>
              <th
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
                Full Name
              </th>
              <th
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
                Daily Rate
              </th>
              <th
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
                OT Rate
              </th>
              <th
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
                Status
              </th>
              <th
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
                Actions
              </th>
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
                  {search ? "No helpers match your search." : "No helpers found."}
                </td>
              </tr>
            ) : (
              filtered.map((helper) => (
                <tr key={helper.id}>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {helper.employeeId}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {helper.fullName}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ₱{Number(helper.dailyRate).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ₱{Number(helper.otRate).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {helper.status === "ACTIVE" ? (
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
                    <HelperDialog mode="edit" helper={helper} />
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
