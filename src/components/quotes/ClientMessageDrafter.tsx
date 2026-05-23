"use client";

import { useState } from "react";
import { generateClientMessageAction } from "@/actions/ai-quotes";

interface Props {
  clientName: string;
  quoteNo: string;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  amount: number;
  vatOption: string;
}

export function ClientMessageDrafter({
  clientName,
  quoteNo,
  serviceType,
  pickupPoint,
  dropoffPoint,
  amount,
  vatOption,
}: Props) {
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    const result = await generateClientMessageAction({
      clientName,
      quoteNo,
      serviceType,
      pickupPoint,
      dropoffPoint,
      amount,
      vatOption,
    });
    setIsGenerating(false);
    if (result.text) setDraft(result.text);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
        Client Message Draft
      </div>
      {draft ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            readOnly
            value={draft}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              background: "var(--surface)",
              color: "var(--ink)",
              resize: "vertical",
              minHeight: 100,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
                background: copied ? "var(--maroon)" : "var(--maroon-tint)",
                color: copied ? "white" : "var(--maroon)",
                border: "1px solid var(--maroon)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
                background: "transparent",
                color: isGenerating ? "var(--muted)" : "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                cursor: isGenerating ? "not-allowed" : "pointer",
              }}
            >
              {isGenerating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Generate a ready-to-send SMS or Viber message for this client with the quote details.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              alignSelf: "flex-start",
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "inherit",
              background: isGenerating ? "var(--surface)" : "var(--maroon-tint)",
              color: isGenerating ? "var(--muted)" : "var(--maroon)",
              border: "1px solid var(--maroon)",
              borderRadius: 6,
              cursor: isGenerating ? "not-allowed" : "pointer",
            }}
          >
            {isGenerating ? "Generating…" : "Draft Message with AI"}
          </button>
        </div>
      )}
    </div>
  );
}
