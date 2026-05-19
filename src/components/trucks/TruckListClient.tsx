"use client";

import { useState } from "react";
import { TruckDialog } from "./TruckDialog";

interface TruckType {
  id: string;
  code: string;
  label: string;
  sizeFt: number;
  wheelType: string;
  fuelKmPerLiter: unknown;
  minBaseRate: unknown;
}

interface Truck {
  id: string;
  code: string;
  plateNo: string;
  truckTypeId: string;
  status: string;
  remarks: string | null;
  truckType: TruckType;
}

interface TruckListClientProps {
  trucks: Truck[];
  truckTypes: TruckType[];
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
  if (status === "UNDER_REPAIR") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          background: "#FCF4E0",
          color: "var(--warning)",
        }}
      >
        Under Repair
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

export function TruckListClient({ trucks, truckTypes }: TruckListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = trucks.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.plateNo.toLowerCase().includes(q) ||
      t.truckType.label.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isFiltered = search.trim() !== "" || statusFilter !== "ALL";

  const dialogTruckTypes = truckTypes.map((tt) => ({
    id: tt.id,
    code: tt.code,
    label: tt.label,
    sizeFt: tt.sizeFt,
    wheelType: tt.wheelType,
  }));

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
            Trucks
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {isFiltered
              ? `Fleet masterlist · ${filtered.length} of ${trucks.length} trucks`
              : `Fleet masterlist · ${trucks.length} truck${trucks.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <TruckDialog mode="add" truckTypes={dialogTruckTypes} />
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
            placeholder="Search by code, plate, or type…"
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
          <option value="UNDER_REPAIR">Under Repair</option>
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
              {["Truck ID", "Plate No.", "Type", "Fuel km/L", "Min Base Rate", "Status", "Actions"].map(
                (h) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  {isFiltered ? "No trucks match your filters." : "No trucks added yet."}
                </td>
              </tr>
            ) : (
              filtered.map((truck, i) => (
                <tr key={truck.id}>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "var(--ink)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {truck.code}
                    </span>
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
                    {truck.plateNo}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      color: "var(--ink-soft)",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {truck.truckType.label}
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
                    {Number(truck.truckType.fuelKmPerLiter).toFixed(1)}
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
                    ₱{Number(truck.truckType.minBaseRate).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {statusBadge(truck.status)}
                  </td>
                  <td
                    style={{
                      padding: "14px 24px",
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <TruckDialog
                      mode="edit"
                      truck={{
                        id: truck.id,
                        code: truck.code,
                        plateNo: truck.plateNo,
                        truckTypeId: truck.truckTypeId,
                        status: truck.status,
                        remarks: truck.remarks,
                      }}
                      truckTypes={dialogTruckTypes}
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
