"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/quotes", label: "Quotes" },
      { href: "/bookings", label: "Bookings" },
      { href: "/calendar", label: "Calendar" },
    ],
  },
  {
    title: "Masterlists",
    items: [
      { href: "/trucks", label: "Trucks" },
      { href: "/drivers", label: "Drivers" },
      { href: "/helpers", label: "Helpers" },
      { href: "/clients", label: "Clients" },
      { href: "/route-areas", label: "Route Areas" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/rate-settings", label: "Rate Settings" },
      { href: "/users", label: "Users" },
    ],
  },
];

interface SidebarProps {
  userInitials?: string;
  userName?: string;
  userRole?: string;
}

export function Sidebar({
  userInitials = "JR",
  userName = "Admin",
  userRole = "Owner · Admin",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        background: "var(--paper)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        paddingTop: 28,
        paddingBottom: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "0 24px 24px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--maroon)",
            letterSpacing: "-0.02em",
          }}
        >
          Joleo
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginTop: 2,
          }}
        >
          Transport · Admin
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--muted)",
                fontWeight: 600,
                padding: "12px 12px 6px",
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 6,
                    color: isActive ? "var(--maroon)" : "var(--ink-soft)",
                    background: isActive ? "var(--maroon-tint)" : "transparent",
                    textDecoration: "none",
                    fontSize: 13.5,
                    fontWeight: 500,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--surface)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isActive ? "var(--maroon)" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--maroon)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{userRole}</div>
        </div>
      </div>
    </aside>
  );
}
