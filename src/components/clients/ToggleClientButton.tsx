"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toggleClientStatusAction } from "@/actions/clients";

function ToggleButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: "transparent",
        color: "var(--ink-soft)",
        border: "none",
        padding: "6px 12px",
        fontSize: 12,
        fontFamily: "inherit",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.5 : 1,
      }}
    >
      {pending ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

export function ToggleClientButton({
  clientId,
  isActive,
}: {
  clientId: string;
  isActive: boolean;
}) {
  const [, formAction] = useActionState(toggleClientStatusAction, undefined);

  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={clientId} />
      <ToggleButton isActive={isActive} />
    </form>
  );
}
