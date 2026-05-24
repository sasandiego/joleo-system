"use client";

import { useState, useTransition } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { sendQuoteEmailAction } from "@/actions/email";

interface Props {
  quoteId: string;
  quoteNo: string;
  clientEmail: string | null;
  canSend: boolean;
}

export function SendEmailButton({ quoteId, quoteNo, clientEmail, canSend }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const disabledReason = !clientEmail
    ? "Client has no email address"
    : !canSend
    ? "Booking must be confirmed first"
    : undefined;

  function handleConfirm() {
    startTransition(async () => {
      const result = await sendQuoteEmailAction(quoteId);
      setOpen(false);
      if ("success" in result) {
        setStatus("success");
        setMessage(`Quotation sent to ${result.to}`);
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {status === "success" && (
        <span style={{ fontSize: 12, color: "var(--success)" }}>{message}</span>
      )}
      {status === "error" && (
        <span style={{ fontSize: 12, color: "var(--danger)" }}>{message}</span>
      )}

      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger asChild>
          <button
            type="button"
            disabled={!canSend || isPending}
            title={disabledReason}
            data-btn
            onClick={() => { setStatus("idle"); setOpen(true); }}
            style={{
              background: "transparent",
              border: "1px solid",
              borderColor: canSend ? "var(--maroon)" : "var(--border)",
              color: canSend ? "var(--maroon)" : "var(--muted)",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: canSend ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: canSend ? 1 : 0.5,
            }}
          >
            {isPending ? "Sending…" : "Send Email to Client"}
          </button>
        </AlertDialog.Trigger>

        <AlertDialog.Portal>
          <AlertDialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
          />
          <AlertDialog.Content
            aria-describedby={undefined}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              borderRadius: 10,
              padding: 28,
              width: 420,
              zIndex: 51,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <AlertDialog.Title style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              Send Quotation by Email
            </AlertDialog.Title>
            <AlertDialog.Description style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
              Send <strong>{quoteNo}</strong> to <strong>{clientEmail}</strong>?
              The PDF will be attached automatically.
            </AlertDialog.Description>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  data-btn
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "8px 18px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                data-btn
                style={{
                  background: "var(--maroon)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? "Sending…" : "Send"}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
