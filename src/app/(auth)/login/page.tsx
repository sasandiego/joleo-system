import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* Left — form side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          background: "white",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          <Image
            src="/joleo-logo.png"
            alt="Joleo Transport"
            width={600}
            height={431}
            priority
            style={{ width: 180, height: "auto", display: "block" }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginTop: 14,
              marginBottom: 44,
            }}
          >
            Admin Portal · Caloocan City
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 500,
              marginBottom: 8,
              color: "var(--ink)",
            }}
          >
            Welcome back
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--muted)",
              marginBottom: 28,
            }}
          >
            Sign in to manage trucks, quotes, and bookings.
          </div>

          <LoginForm />

          <div
            style={{
              marginTop: 32,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            Authorized admins only · Contact owner for access
          </div>
        </div>
      </div>

      {/* Right — visual side */}
      <div
        style={{
          background: "var(--maroon)",
          color: "white",
          padding: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "var(--maroon-light)",
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "var(--maroon-dark)",
            opacity: 0.4,
          }}
        />

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.7,
            position: "relative",
            zIndex: 1,
          }}
        >
          Brgy. 164, Caloocan City
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              lineHeight: 1.2,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Your best
            <br />
            trucking
            <br />
            partner.
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 13,
              opacity: 0.8,
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            Serving all points in Luzon — from Metro Manila to Bicol, Mindoro,
            and beyond.
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.7,
            position: "relative",
            zIndex: 1,
          }}
        >
          Phase 1 · Admin Portal v1.0
        </div>
      </div>
    </div>
  );
}
