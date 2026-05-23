"use server";

import { chatComplete } from "@/lib/ai";

export async function generateServiceDescriptionAction(input: {
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  truckType: string;
  numberOfHelpers: number;
  billingType: string;
  notes?: string;
}): Promise<{ text?: string; error?: string }> {
  try {
    const billing = input.billingType === "EIGHT_HOUR" ? "8-hour service" : "per-trip flat rate";
    const service = input.serviceType.replace(/_/g, " ").toLowerCase();
    const notesBlock = input.notes && input.notes.trim()
      ? `\nInternal notes (special client requests — translate into client-appropriate language; do not quote verbatim):\n${input.notes.trim()}\n`
      : "";
    const text = await chatComplete(
      `Write a professional 2–3 sentence service description for a trucking quotation document.

Service: ${service}
From: ${input.pickupPoint}
To: ${input.dropoffPoint}
Truck: ${input.truckType}
Helpers: ${input.numberOfHelpers}
Billing: ${billing}${notesBlock}

Rules:
- Start with "We are pleased to provide"
- Plain English, no markdown, no bullet points
- Maximum 3 sentences
- Professional but straightforward tone
- If internal notes are present, summarize any client-facing requests naturally in the description`,
      180,
    );
    return { text };
  } catch {
    return { error: "Could not generate description. You can type it manually." };
  }
}

export async function generateClientMessageAction(input: {
  clientName: string;
  quoteNo: string;
  serviceType: string;
  pickupPoint: string;
  dropoffPoint: string;
  amount: number;
  vatOption: string;
}): Promise<{ text?: string; error?: string }> {
  try {
    const vatLabel =
      input.vatOption === "NON_VAT"
        ? "Non-VAT"
        : input.vatOption === "VAT_INCLUSIVE"
          ? "VAT Inclusive"
          : "VAT Exclusive";
    const formatted = `₱${input.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    const service = input.serviceType.replace(/_/g, " ").toLowerCase();

    const text = await chatComplete(
      `Write a short, professional SMS/Viber message to send a client their trucking quotation.

Quote No: ${input.quoteNo}
Client: ${input.clientName}
Service: ${service}
From: ${input.pickupPoint}
To: ${input.dropoffPoint}
Total: ${formatted} (${vatLabel})

Rules:
- 3–4 sentences maximum
- Friendly but professional
- Mention the quote number and total amount
- End by asking them to confirm or reply
- Plain text only, no markdown`,
      160,
    );
    return { text };
  } catch {
    return { error: "Could not generate message draft." };
  }
}
