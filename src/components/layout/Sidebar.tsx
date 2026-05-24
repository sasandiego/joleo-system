"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/actions/auth";

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
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/pricing-config", label: "Pricing Config" },
      { href: "/payment-config", label: "Payment Details" },
      { href: "/company-profile", label: "Company Profile" },
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
          padding: "0 20px 22px",
          marginBottom: 14,
          position: "relative",
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: "block", textDecoration: "none" }}
          aria-label="Joleo Transport — Dashboard"
        >
          <Image
            src="/joleo-logo.png"
            alt="Joleo Transport"
            width={600}
            height={431}
            priority
            style={{
              width: "100%",
              maxWidth: 160,
              height: "auto",
              display: "block",
            }}
          />
        </Link>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginTop: 10,
          }}
        >
          Admin · Portal
        </div>

        {/* Decorative rule — short maroon stroke + thin hairline */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 20,
            right: 20,
            height: 1,
            background: "var(--border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 20,
            width: 32,
            height: 1,
            background: "var(--maroon)",
          }}
        />
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
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface)";
              (e.currentTarget as HTMLElement).style.color = "var(--maroon)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--maroon)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
