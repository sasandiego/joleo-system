"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        marginTop: 8,
        padding: 11,
        background: pending ? "var(--maroon-light)" : "var(--maroon)",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        cursor: pending ? "not-allowed" : "pointer",
        width: "100%",
        transition: "background 0.12s",
      }}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="username"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-soft)",
            letterSpacing: "0.01em",
          }}
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="e.g. admin"
          autoComplete="username"
          required
          style={{
            fontFamily: "inherit",
            fontSize: 13.5,
            padding: "9px 12px",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            background: "white",
            color: "var(--ink)",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="password"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-soft)",
            letterSpacing: "0.01em",
          }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          style={{
            fontFamily: "inherit",
            fontSize: 13.5,
            padding: "9px 12px",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            background: "white",
            color: "var(--ink)",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {state?.error && (
        <div
          style={{
            fontSize: 12,
            color: "var(--danger)",
            background: "#FBEAE7",
            border: "1px solid #F5C2BC",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
