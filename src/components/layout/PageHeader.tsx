import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // action buttons
  className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(className)}
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
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {children}
        </div>
      )}
    </div>
  );
}
