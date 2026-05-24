"use server";

import { Resend } from "resend";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { generateQuotePdf } from "@/lib/generate-pdf";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PricingResult } from "@/features/pricing/types";

const resend = new Resend(env.RESEND_API_KEY);

const CONFIRMED_STATUSES = ["CONFIRMED", "DISPATCHED", "COMPLETED"];

export async function sendQuoteEmailAction(
  quoteId: string,
): Promise<{ success: true; to: string } | { error: string }> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: { select: { clientName: true, email: true } },
      booking: { select: { status: true } },
    },
  });

  if (!quote) return { error: "Quote not found." };
  if (!quote.client?.email) return { error: "Client has no email address." };
  if (!quote.booking || !CONFIRMED_STATUSES.includes(quote.booking.status)) {
    return { error: "Booking must be confirmed before sending the quotation." };
  }

  const paymentConfig = await db.paymentConfig.findUnique({
    where: { id: 1 },
    include: { companyProfile: true },
  });

  if (!paymentConfig?.companyProfile) return { error: "Company profile not configured." };

  const pricing = quote.pricingSnapshot as unknown as PricingResult;
  const company = paymentConfig.companyProfile;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateQuotePdf(quoteId);
  } catch (err) {
    console.error("[EMAIL] PDF generation failed:", err);
    return { error: "Failed to generate PDF." };
  }

  const scheduledStr = quote.scheduledDate ? formatDate(quote.scheduledDate) : "TBD";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">

  <p>Good day!</p>

  <p>Please find attached your quotation from <strong>Joleo Transport</strong>.</p>

  <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 6px 0; color: #666; width: 140px;">Quote No.</td><td style="padding: 6px 0; font-weight: bold;">${quote.quoteNo}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${quote.pickupPoint} &rarr; ${quote.dropoffPoint}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Scheduled</td><td style="padding: 6px 0;">${scheduledStr}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Amount</td><td style="padding: 6px 0; font-weight: bold; color: #8B0000;">${formatCurrency(pricing.finalPrice)}</td></tr>
  </table>

  <div style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #8B0000; margin-bottom: 12px;">Payment Details</div>
    <p style="margin: 4px 0;">&#127981; <strong>${paymentConfig.bank1Name}</strong> &mdash; ${paymentConfig.bank1Account} (${paymentConfig.bank1Holder})</p>
    <p style="margin: 4px 0;">&#127981; <strong>${paymentConfig.bank2Name}</strong> &mdash; ${paymentConfig.bank2Account} (${paymentConfig.bank2Holder})</p>
    <p style="margin: 4px 0;">&#128242; <strong>GCash</strong> &mdash; ${paymentConfig.gcashNumber} (${paymentConfig.gcashHolder})</p>
  </div>

  <p>For questions or to confirm your booking, please contact us:<br>
  &#128222; ${company.phone} &nbsp;&middot;&nbsp; &#128242; ${company.mobile} &nbsp;&middot;&nbsp; &#128231; <a href="mailto:${company.email}">${company.email}</a></p>

  <p>Thank you for choosing Joleo Transport.</p>

  <p style="color: #666; font-size: 12px; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 12px;">
    Joleo Transport &middot; ${company.address}
  </p>

</body>
</html>`;

  try {
    await resend.emails.send({
      from: "noreply@sas-agent.co.uk",
      to: quote.client.email,
      subject: `Quotation ${quote.quoteNo} — Joleo Transport`,
      html,
      attachments: [
        {
          filename: `${quote.quoteNo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } catch (err) {
    console.error("[EMAIL] Resend failed:", err);
    return { error: "Failed to send email. Please try again." };
  }

  return { success: true, to: quote.client.email };
}
