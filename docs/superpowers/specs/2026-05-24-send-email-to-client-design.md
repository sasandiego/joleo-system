# Design: Send Email to Client

**Date:** 2026-05-24
**Feature:** Send quotation PDF via email from the quote detail page
**Status:** Approved — ready for implementation planning

---

## Overview

Add a **"Send Email to Client"** button to the quote detail page. When clicked, generates the PDF quotation and sends it as an email attachment to the client's email address via Resend. The button is always visible but disabled until both conditions are met: the client has an email address on file, and the linked booking has reached `CONFIRMED` status (or beyond).

Also introduces a `CompanyProfile` singleton model to store Joleo's contact details (replacing hardcoded values in the email template), with `PaymentConfig` updated to reference it via foreign key. The PDF quotation document is not changed — contact details appear only in the email body.

---

## User Flow

1. Vyela/Gina opens `/quotes/[id]`
2. **"Send Email to Client"** button appears in the header alongside Edit and Download PDF
3. Button is **disabled** (visible but not clickable) when either:
   - Client has no email address, OR
   - Linked booking does not exist or has not reached `CONFIRMED` status
4. Button is **enabled** when client has email AND booking status is one of: `CONFIRMED`, `DISPATCHED`, `COMPLETED`
5. Admin clicks the enabled button → Radix `AlertDialog` opens:
   > *"Send quotation QT-YYYYMMDD-NNNN to client@email.com?"*
   > `[Cancel]` `[Send]`
6. Admin confirms → button enters loading state → `sendQuoteEmailAction` runs
7. **Success:** green toast — *"Quotation sent to client@email.com"*
8. **Error:** red toast — *"Failed to send — please try again"*

---

## Email Template

**From:** `noreply@sas-agent.co.uk`
**To:** `client.email`
**Subject:** `Quotation [quoteNo] — Joleo Transport`
**Attachment:** `[quoteNo].pdf` (same output as the Download PDF button)

**Body (HTML):**
```
Good day!

Please find attached your quotation from Joleo Transport.

Quote No.:   [quoteNo]
Service:     [pickupLocation] → [dropoffLocation]
Scheduled:   [scheduledDate, Asia/Manila]
Amount:      ₱[finalPrice]

Payment Details
🏦 [bank1Name] — [bank1AccountNo] ([bank1AccountName])
🏦 [bank2Name] — [bank2AccountNo] ([bank2AccountName])
📱 GCash — [gcashNo] ([gcashName])

For questions or to confirm your booking, please contact us:
📞 [companyProfile.phone] · 📱 [companyProfile.mobile] · 📧 [companyProfile.email]

Thank you for choosing Joleo Transport.

Joleo Transport · [companyProfile.address]
```

Payment details pulled live from `PaymentConfig` at send time.
Contact details pulled live from `CompanyProfile` at send time.

---

## Schema Changes

### New model: `CompanyProfile`
```prisma
model CompanyProfile {
  id            Int            @id @default(1)
  phone         String
  mobile        String
  email         String
  address       String
  paymentConfig PaymentConfig?
}
```

Seeded values:
- `phone`: `(02) 7000-8985`
- `mobile`: `0917-132-9915`
- `email`: `joleo.transport@gmail.com`
- `address`: `GSIS Hills, Talipapa, Caloocan`

### Modified model: `PaymentConfig`
Add `companyProfileId` foreign key:
```prisma
model PaymentConfig {
  id               Int            @id @default(1)
  companyProfileId Int            @unique
  companyProfile   CompanyProfile @relation(fields: [companyProfileId], references: [id])
  // ... existing bank/GCash fields unchanged
}
```

### Migrations required
1. `20260524000000_company_profile` — create `CompanyProfile` table
2. `20260524010000_payment_config_fk` — add `companyProfileId` to `PaymentConfig`

---

## Architecture

### Files Created

| File | Purpose |
|---|---|
| `src/lib/generate-pdf.ts` | Shared `generateQuotePdf(quoteId): Promise<Buffer>` — extracted from API route, called by both download route and email action |
| `src/actions/email.ts` | `sendQuoteEmailAction(quoteId)` — validates booking status + client email, calls `generateQuotePdf()`, sends via Resend API |
| `src/app/(admin)/company-profile/page.tsx` | Admin page to view/edit `CompanyProfile` singleton |
| `src/components/company-profile/CompanyProfileForm.tsx` | Client component form for editing phone, mobile, email, address |
| `src/actions/company-profile.ts` | `updateCompanyProfileAction` — upsert id=1 |

### Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `CompanyProfile` model; add `companyProfileId` FK to `PaymentConfig` |
| `prisma/seed.ts` | Seed `CompanyProfile` with Joleo's details; update `PaymentConfig` seed to set `companyProfileId: 1` |
| `src/app/api/quotes/[id]/pdf/route.tsx` | Refactor to call `generateQuotePdf()` instead of inlining PDF logic |
| `src/app/(admin)/quotes/[id]/page.tsx` | Add Send Email button, AlertDialog, disabled state logic, toast feedback |
| `src/components/layout/Sidebar.tsx` | Add "Company Profile" under Configuration section |
| `src/lib/env.ts` | Add `RESEND_API_KEY: z.string()` |
| `.env.local` | Add `RESEND_API_KEY=re_...` |

---

## Button Disabled Logic

```ts
const canSendEmail =
  !!quote.client.email &&
  !!quote.booking &&
  ['CONFIRMED', 'DISPATCHED', 'COMPLETED'].includes(quote.booking.status)
```

Tooltip when disabled: `"Booking must be confirmed and client must have an email address"`

---

## `sendQuoteEmailAction` Logic

```
1. Fetch quote with client, booking, pricingSnapshot, paymentConfig (via companyProfile relation)
2. Guard: if !client.email → return { error: "Client has no email" }
3. Guard: if booking status not in [CONFIRMED, DISPATCHED, COMPLETED] → return { error: "Booking not confirmed" }
4. Call generateQuotePdf(quoteId) → Buffer
5. Send via Resend:
   - from: noreply@sas-agent.co.uk
   - to: client.email
   - subject: `Quotation ${quoteNo} — Joleo Transport`
   - html: template with quote details + payment details + company contact
   - attachments: [{ filename: `${quoteNo}.pdf`, content: pdfBuffer }]
6. Return { success: true } or { error: "Failed to send" }
```

---

## `generateQuotePdf` Utility

Extracted from `src/app/api/quotes/[id]/pdf/route.tsx`. Signature:

```ts
export async function generateQuotePdf(quoteId: string): Promise<Buffer>
```

- Fetches quote + client + pricingSnapshot + `PaymentConfig` (with `companyProfile` included via relation) from DB
- Renders `<QuotationPDF />` using `@react-pdf/renderer`'s `renderToBuffer()`
- Returns raw `Buffer` — caller decides whether to stream as HTTP response (API route) or attach to email (email action)

---

## New Admin Page: `/company-profile`

Same pattern as `/payment-config`:
- Server page loads the singleton (`db.companyProfile.findFirst()`)
- `CompanyProfileForm` client component with 4 fields: Phone, Mobile, Email, Address
- `updateCompanyProfileAction` upserts `id=1`
- Sidebar entry: **Configuration → Company Profile**

---

## Environment

```env
RESEND_API_KEY=re_xxxx   # actual key provided by Shem, stored in .env.local only
```

Added to `.env.local` and validated in `src/lib/env.ts`.

---

## New npm Dependency

`resend` — approved by Shem on 2026-05-24.

---

## Out of Scope

- Email tracking (open/click rates)
- Resend webhooks
- Email log / sent history in the UI (AuditLog entry not included per user choice — option B)
- Multi-company support
- Editable email body before send
