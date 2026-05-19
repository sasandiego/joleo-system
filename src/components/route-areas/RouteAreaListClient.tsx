"use client";

import { RouteAreaDialog } from "./RouteAreaDialog";

interface RouteArea {
  id: string;
  code: string;
  label: string;
  sampleDest: string | null;
  distanceMinKm: number;
  distanceMaxKm: number;
  surcharge: number | string;
  estimatedToll: number | string;
  isLongDistance: boolean;
  remarks: string | null;
}

interface RouteAreaListClientProps {
  routeAreas: RouteArea[];
}

export function RouteAreaListClient({ routeAreas }: RouteAreaListClientProps) {
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
            Route Areas
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Delivery coverage zones · {routeAreas.length} area{routeAreas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <RouteAreaDialog mode="add" />
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
              {["Code", "Label", "Distance", "Surcharge", "Est. Toll", "Long Dist.", "Actions"].map(
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
            {routeAreas.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "32px 24px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  No route areas found.
                </td>
              </tr>
            ) : (
              routeAreas.map((area) => {
                const surchargeVal = Number(area.surcharge);
                const tollVal = Number(area.estimatedToll);
                return (
                  <tr key={area.id}>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          border: "1px solid var(--border-strong)",
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {area.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {area.label}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                        fontFamily: "var(--font-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {area.distanceMinKm} – {area.distanceMaxKm} km
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {surchargeVal === 0
                        ? "—"
                        : `₱${surchargeVal.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {tollVal === 0
                        ? "—"
                        : `₱${tollVal.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {area.isLongDistance ? (
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
                          Long dist.
                        </span>
                      ) : null}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        color: "var(--ink-soft)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <RouteAreaDialog mode="edit" routeArea={area} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
