"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction } from "@/actions/users";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "9px 16px",
        background: pending ? "var(--maroon-light)" : "var(--maroon)",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Resetting…" : "Reset password"}
    </button>
  );
}

interface ResetPasswordDialogProps {
  userId: string;
  userName: string;
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(resetPasswordAction, undefined);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          style={{
            padding: "6px 12px",
            background: "white",
            color: "var(--ink)",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reset password
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            borderRadius: 10,
            border: "1px solid var(--border)",
            padding: 32,
            width: 400,
            zIndex: 51,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <Dialog.Title
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              marginBottom: 8,
              color: "var(--ink)",
            }}
          >
            Reset password
          </Dialog.Title>
          <Dialog.Description
            style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}
          >
            Set a new password for{" "}
            <strong style={{ color: "var(--ink-soft)" }}>{userName}</strong>.
            They will need to use this password on next login.
          </Dialog.Description>

          {state?.success ? (
            <div>
              <div
                style={{
                  background: "#E8F5EC",
                  border: "1px solid #C5E4CF",
                  color: "var(--success)",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Password reset successfully.
              </div>
              <Dialog.Close asChild>
                <button
                  style={{
                    padding: "9px 16px",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <form action={formAction}>
              <input type="hidden" name="userId" value={userId} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                <label
                  htmlFor={`pwd-${userId}`}
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}
                >
                  New password
                </label>
                <input
                  id={`pwd-${userId}`}
                  name="newPassword"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
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
                    marginBottom: 16,
                  }}
                >
                  {state.error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    style={{
                      padding: "9px 16px",
                      background: "white",
                      color: "var(--ink)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 6,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <SubmitButton />
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
