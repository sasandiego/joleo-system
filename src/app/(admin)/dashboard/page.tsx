import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Operations overview for today"
      />

      {/* Stat cards placeholder — real data wired in M8 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Active Bookings", value: "—" },
          { label: "Fleet Active", value: "—" },
          { label: "Quotes This Month", value: "—" },
          { label: "Revenue MTD", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 34,
                fontWeight: 500,
                marginTop: 8,
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 3,
                height: "100%",
                background: "var(--maroon)",
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          Today&apos;s Schedule
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          No bookings scheduled for today. Create your first quote to get started.
        </p>
      </div>
    </div>
  );
}
