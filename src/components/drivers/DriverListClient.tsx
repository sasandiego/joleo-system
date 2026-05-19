"use client";

import { useState } from "react";
import { DriverDialog } from "./DriverDialog";

interface Driver {
  id: string;
  employeeId: string;
  fullName: string;
  dailyRate: unknown;
  otRate: unknown;
  status: string;
  remarks: string | null;
}

interface DriverListClientProps {
  drivers: Driver[];
}

function statusBadge(status: string) {
  if (status === "ACTIVE") {
    return (
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
    );
  }
  return (
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
  );
}

export function DriverListClient({ drivers }: DriverListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.employeeId.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isFiltered = search.trim() !== "" || statusFilter !== "ALL";

  return (
    <>
      {/* Page Header */}
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
            Drivers
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {isFiltered
              ? `Driver roster · ${filtered.length} of ${drivers.length} drivers`
              : `Driver roster · ${drivers.length} driver${drivers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <DriverDialog mode="add" />
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
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
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search by name or Employee ID…"
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            fontFamily: "inherit",
            fontSize: 13.5,
            padding: "9px 12px",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            background: "white",
            color: "var(--ink)",
            outline: "none",
            boxSizing: "border-box",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table Card */}
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
              {["Employee ID", "Full Name", "Daily Rate", "OT Rate", "Status", "Actions"].map((h) => (
                <th
                  key={h}
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
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  {isFiltered ? "No drivers match your filters." : "No drivers added yet."}
                </td>
              </tr>
            ) : (
              filtered.map((driver, i) => (
                <tr key={driver.id}>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {driver.employeeId}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      fontWeight: 500,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {driver.fullName}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    ₱{Number(driver.dailyRate).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    ₱{Number(driver.otRate).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {statusBadge(driver.status)}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <DriverDialog
                      mode="edit"
                      driver={{
                        id: driver.id,
                        employeeId: driver.employeeId,
                        fullName: driver.fullName,
                        dailyRate: driver.dailyRate,
                        otRate: driver.otRate,
                        status: driver.status,
                        remarks: driver.remarks,
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
