# Send Email to Client — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Send Email to Client" button to the quote detail page that emails the PDF quotation to the client via Resend, gated on booking status = CONFIRMED+.

**Architecture:** New `CompanyProfile` singleton + FK on `PaymentConfig`; shared `generateQuotePdf()` utility extracted from the existing PDF route; `sendQuoteEmailAction` server action calls the utility then Resend; `SendEmailButton` client component handles the AlertDialog confirmation + inline feedback.

**Tech Stack:** Prisma (schema + migrations), Resend SDK (`resend` npm package), `@react-pdf/renderer` (existing), Next.js Server Actions, Radix AlertDialog (existing via shadcn/ui), React `useTransition`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `CompanyProfile` model; add `companyProfileId` FK to `PaymentConfig` |
| `prisma/migrations/20260524000000_company_profile/migration.sql` | Create | Create `CompanyProfile` table + seed row |
| `prisma/migrations/20260524010000_payment_config_fk/migration.sql` | Create | Add `companyProfileId` FK column to `PaymentConfig` |
| `prisma/seed.ts` | Modify | Seed `CompanyProfile` id=1; add `companyProfileId:1` to PaymentConfig create |
| `src/lib/env.ts` | Modify | Add `RESEND_API_KEY` to Zod schema |
| `.env.local` | Modify | Add `RESEND_API_KEY=re_xxxx  # key provided by Shem — stored in .env.local only, never commit` |
| `src/lib/generate-pdf.ts` | Create | Shared `generateQuotePdf(quoteId): Promise<Buffer>` |
| `src/app/api/quotes/[id]/pdf/route.tsx` | Modify | Thin wrapper calling `generateQuotePdf()` |
| `src/actions/company-profile.ts` | Create | `updateCompanyProfileAction` — upsert id=1 |
| `src/components/company-profile/CompanyProfileForm.tsx` | Create | Form for Phone/Mobile/Email/Address |
| `src/app/(admin)/company-profile/page.tsx` | Create | Admin page, loads singleton, renders form |
| `src/app/(admin)/payment-config/page.tsx` | Modify | Add `companyProfileId:1` to the upsert create fallback |
| `src/components/layout/Sidebar.tsx` | Modify | Add "Company Profile" to Configuration section |
| `src/actions/email.ts` | Create | `sendQuoteEmailAction(quoteId)` — guards + PDF + Resend |
| `src/components/quotes/SendEmailButton.tsx` | Create | Client component: AlertDialog + loading + inline feedback |
| `src/app/(admin)/quotes/[id]/page.tsx` | Modify | Add `email` to client select, `status` to booking select; render `SendEmailButton` |

---

## Task 1: Schema — Add CompanyProfile + PaymentConfig FK

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `CompanyProfile` model and update `PaymentConfig` in schema.prisma**

In `prisma/schema.prisma`, add the new model after `PaymentConfig` and update `PaymentConfig`:

Replace the existing `PaymentConfig` model:
```prisma
// SINGLETON: only one row, id = 1. Payment method details shown on PDF quotations.
model PaymentConfig {
  id               Int            @id @default(1)
  companyProfileId Int            @unique
  companyProfile   CompanyProfile @relation(fields: [companyProfileId], references: [id])
  bank1Name        String         @default("EASTWEST BANK")
  bank1Holder      String         @default("JOLEO TRANSPORT")
  bank1Account     String         @default("200048853462")
  bank2Name        String         @default("BDO UNIBANK")
  bank2Holder      String         @default("JOLEO TRANSPORT")
  bank2Account     String         @default("013208001304")
  gcashHolder      String         @default("LEOVINA SALVADOR")
  gcashNumber      String         @default("09178305652")
  updatedAt        DateTime       @updatedAt
}

// SINGLETON: only one row, id = 1. Joleo Transport company contact details.
model CompanyProfile {
  id            Int            @id @default(1)
  phone         String
  mobile        String
  email         String
  address       String
  paymentConfig PaymentConfig?
}
```

---

## Task 2: Migrations

**Files:**
- Create: `prisma/migrations/20260524000000_company_profile/migration.sql`
- Create: `prisma/migrations/20260524010000_payment_config_fk/migration.sql`

- [ ] **Step 1: Create migration 1 — CompanyProfile table**

Create file `prisma/migrations/20260524000000_company_profile/migration.sql`:
```sql
-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row immediately so the FK migration can reference it
INSERT INTO "CompanyProfile" ("id", "phone", "mobile", "email", "address")
VALUES (1, '(02) 7000-8985', '0917-132-9915', 'joleo.transport@gmail.com', 'GSIS Hills, Talipapa, Caloocan');
```

- [ ] **Step 2: Create migration 2 — PaymentConfig FK**

Create file `prisma/migrations/20260524010000_payment_config_fk/migration.sql`:
```sql
-- Add companyProfileId column (nullable first so existing rows don't fail)
ALTER TABLE "PaymentConfig" ADD COLUMN "companyProfileId" INTEGER;

-- Backfill existing singleton row
UPDATE "PaymentConfig" SET "companyProfileId" = 1;

-- Make NOT NULL
ALTER TABLE "PaymentConfig" ALTER COLUMN "companyProfileId" SET NOT NULL;

-- Add UNIQUE constraint
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_companyProfileId_key" UNIQUE ("companyProfileId");

-- Add FK constraint
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_companyProfileId_fkey"
  FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 3: Apply migrations and regenerate Prisma client**

```bash
cd /home/agent/projects/joleo-system && pnpm prisma migrate deploy && pnpm prisma generate
```

Expected output: two new migrations applied, `✔  Generated Prisma Client`

- [ ] **Step 4: Restart dev server to pick up new Prisma client**

```bash
pkill -f "next dev" 2>/dev/null; rm -rf /home/agent/projects/joleo-system/.next && cd /home/agent/projects/joleo-system && pnpm dev &
```

Wait ~10 seconds for the server to start before continuing.

---

## Task 3: Environment + Install Resend

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.local`

- [ ] **Step 1: Add RESEND_API_KEY to env.ts**

In `src/lib/env.ts`, add to `envSchema`:
```ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LITELLM_BASE_URL: z.string().url().optional(),
  LITELLM_API_KEY: z.string().optional(),
  LITELLM_MODEL: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  SEED_ADMIN_1_USERNAME: z.string().optional(),
  SEED_ADMIN_1_PASSWORD: z.string().optional(),
  SEED_ADMIN_1_FULLNAME: z.string().optional(),
  SEED_ADMIN_2_USERNAME: z.string().optional(),
  SEED_ADMIN_2_PASSWORD: z.string().optional(),
  SEED_ADMIN_2_FULLNAME: z.string().optional(),
  SEED_ADMIN_3_USERNAME: z.string().optional(),
  SEED_ADMIN_3_PASSWORD: z.string().optional(),
  SEED_ADMIN_3_FULLNAME: z.string().optional(),
});
```

- [ ] **Step 2: Add RESEND_API_KEY to .env.local**

Append to `/home/agent/projects/joleo-system/.env.local`:
```
RESEND_API_KEY=re_xxxx  # key provided by Shem — stored in .env.local only, never commit
```

- [ ] **Step 3: Install resend package**

```bash
cd /home/agent/projects/joleo-system && pnpm add resend
```

Expected: `+ resend x.x.x` added to dependencies.

---

## Task 4: Update Seed

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add CompanyProfile seed before PaymentConfig seed**

In `prisma/seed.ts`, add before the `// ── PaymentConfig` block:
```ts
  // ── CompanyProfile ────────────────────────────────────────
  console.log("  → CompanyProfile");
  await prisma.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phone: "(02) 7000-8985",
      mobile: "0917-132-9915",
      email: "joleo.transport@gmail.com",
      address: "GSIS Hills, Talipapa, Caloocan",
    },
  });
```

- [ ] **Step 2: Update PaymentConfig seed to include companyProfileId**

Replace the existing `prisma.paymentConfig.upsert` call:
```ts
  // ── PaymentConfig ─────────────────────────────────────────
  console.log("  → PaymentConfig");
  await prisma.paymentConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyProfileId: 1,
      bank1Name: "EASTWEST BANK",
      bank1Holder: "JOLEO TRANSPORT",
      bank1Account: "200048853462",
      bank2Name: "BDO UNIBANK",
      bank2Holder: "JOLEO TRANSPORT",
      bank2Account: "013208001304",
      gcashHolder: "LEOVINA SALVADOR",
      gcashNumber: "09178305652",
    },
  });
```

---

## Task 5: Create `generateQuotePdf` Utility

**Files:**
- Create: `src/lib/generate-pdf.ts`

- [ ] **Step 1: Create the shared PDF generation utility**

Create `src/lib/generate-pdf.ts`:
```ts
import React from "react";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import type { PricingResult } from "@/features/pricing/types";
import { formatDate } from "@/lib/format";

export async function generateQuotePdf(quoteId: string): Promise<Buffer> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: { select: { clientName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) throw new Error(`Quote ${quoteId} not found`);

  const [truckType, paymentConfig] = await Promise.all([
    quote.truckTypeId
      ? db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
      : null,
    db.paymentConfig.findUnique({ where: { id: 1 } }),
  ]);

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  return renderToBuffer(
    React.createElement(QuotationPDF, {
      quoteNo: quote.quoteNo,
      status: quote.status,
      clientName: quote.client?.clientName ?? quote.walkInName ?? "Walk-in",
      contactPerson: quote.client?.contactPerson ?? null,
      serviceType: quote.serviceType,
      pickupPoint: quote.pickupPoint,
      dropoffPoint: quote.dropoffPoint,
      scheduledDate: quote.scheduledDate ? formatDate(quote.scheduledDate) : null,
      scheduledStartTime: quote.scheduledStartTime,
      truckType: truckType?.label ?? null,
      numberOfHelpers: quote.numberOfHelpers,
      pricing,
      createdAt: formatDate(quote.createdAt),
      createdBy: quote.createdBy.username,
      serviceDescription: quote.serviceDescription,
      paymentTerms: quote.paymentTerms,
      paymentConfig,
    })
  ) as Promise<Buffer>;
}
```

> **Note:** Uses `React.createElement` instead of JSX because this file doesn't have `.tsx` extension and we don't want to set up JSX for a `.ts` file. Alternatively, name the file `generate-pdf.tsx` — if you do, add `import React from "react"` at the top and use JSX syntax matching `QuotationPDF.tsx`.

Actually — create the file as `src/lib/generate-pdf.tsx` (not .ts) and use JSX:

```tsx
import React from "react";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import type { PricingResult } from "@/features/pricing/types";
import { formatDate } from "@/lib/format";

export async function generateQuotePdf(quoteId: string): Promise<Buffer> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: { select: { clientName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) throw new Error(`Quote ${quoteId} not found`);

  const [truckType, paymentConfig] = await Promise.all([
    quote.truckTypeId
      ? db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
      : null,
    db.paymentConfig.findUnique({ where: { id: 1 } }),
  ]);

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  return renderToBuffer(
    <QuotationPDF
      quoteNo={quote.quoteNo}
      status={quote.status}
      clientName={quote.client?.clientName ?? quote.walkInName ?? "Walk-in"}
      contactPerson={quote.client?.contactPerson ?? null}
      serviceType={quote.serviceType}
      pickupPoint={quote.pickupPoint}
      dropoffPoint={quote.dropoffPoint}
      scheduledDate={quote.scheduledDate ? formatDate(quote.scheduledDate) : null}
      scheduledStartTime={quote.scheduledStartTime}
      truckType={truckType?.label ?? null}
      numberOfHelpers={quote.numberOfHelpers}
      pricing={pricing}
      createdAt={formatDate(quote.createdAt)}
      createdBy={quote.createdBy.username}
      serviceDescription={quote.serviceDescription}
      paymentTerms={quote.paymentTerms}
      paymentConfig={paymentConfig}
    />
  ) as Promise<Buffer>;
}
```

---

## Task 6: Refactor PDF Download Route

**Files:**
- Modify: `src/app/api/quotes/[id]/pdf/route.tsx`

- [ ] **Step 1: Replace route with thin wrapper calling generateQuotePdf**

Replace the entire contents of `src/app/api/quotes/[id]/pdf/route.tsx`:
```tsx
import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { generateQuotePdf } from "@/lib/generate-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const quote = await db.quote.findUnique({ where: { id }, select: { quoteNo: true } });
  if (!quote) return new Response("Not found", { status: 404 });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateQuotePdf(id);
  } catch (err) {
    console.error("[PDF] generateQuotePdf failed:", err);
    return new Response(`PDF generation failed: ${String(err)}`, { status: 500 });
  }

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNo}.pdf"`,
    },
  });
}
```

- [ ] **Step 2: Verify PDF download still works**

Open `https://joleo.sas-agent.co.uk/quotes` in a browser, open any quote, click "Download PDF". Confirm the PDF downloads correctly.

---

## Task 7: CompanyProfile Server Action

**Files:**
- Create: `src/actions/company-profile.ts`

- [ ] **Step 1: Create the server action**

Create `src/actions/company-profile.ts`:
```ts
"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  phone:   z.string().min(1, "Phone is required"),
  mobile:  z.string().min(1, "Mobile is required"),
  email:   z.string().email("Valid email required"),
  address: z.string().min(1, "Address is required"),
});

export async function updateCompanyProfileAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await db.companyProfile.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidatePath("/company-profile");
  return { success: true };
}
```

---

## Task 8: CompanyProfileForm Component

**Files:**
- Create: `src/components/company-profile/CompanyProfileForm.tsx`

- [ ] **Step 1: Create the form component**

Create `src/components/company-profile/CompanyProfileForm.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCompanyProfileAction } from "@/actions/company-profile";
import { PageHeader } from "@/components/layout/PageHeader";

interface Profile {
  phone:   string;
  mobile:  string;
  email:   string;
  address: string;
}

interface Props { initial: Profile; }

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-btn
      style={{
        background: "var(--maroon)",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "9px 20px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  background: "white",
  color: "var(--ink)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input name={name} defaultValue={defaultValue} type={type} style={inputStyle} required />
    </div>
  );
}

export function CompanyProfileForm({ initial }: Props) {
  const [state, action] = useActionState(updateCompanyProfileAction, undefined);

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle="Joleo Transport contact details shown in client email notifications"
      />

      <form action={action}>
        <div
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 24px",
            maxWidth: 700,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--maroon)",
              paddingBottom: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            Contact Information
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Landline"      name="phone"   defaultValue={initial.phone} />
            <Field label="Mobile"        name="mobile"  defaultValue={initial.mobile} />
          </div>
          <Field label="Email"   name="email"   defaultValue={initial.email}   type="email" />
          <Field label="Address" name="address" defaultValue={initial.address} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 4 }}>
            {state?.error && (
              <span style={{ fontSize: 13, color: "var(--danger)" }}>{state.error}</span>
            )}
            {state?.success && (
              <span style={{ fontSize: 13, color: "var(--success)" }}>Saved.</span>
            )}
            <SaveButton />
          </div>
        </div>
      </form>
    </div>
  );
}
```

---

## Task 9: Company Profile Admin Page

**Files:**
- Create: `src/app/(admin)/company-profile/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(admin)/company-profile/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { CompanyProfileForm } from "@/components/company-profile/CompanyProfileForm";

export default async function CompanyProfilePage() {
  const profile = await db.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phone: "(02) 7000-8985",
      mobile: "0917-132-9915",
      email: "joleo.transport@gmail.com",
      address: "GSIS Hills, Talipapa, Caloocan",
    },
  });

  return (
    <CompanyProfileForm
      initial={{
        phone:   profile.phone,
        mobile:  profile.mobile,
        email:   profile.email,
        address: profile.address,
      }}
    />
  );
}
```

---

## Task 10: Sidebar + PaymentConfig Page Updates

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/app/(admin)/payment-config/page.tsx`

- [ ] **Step 1: Add Company Profile to Sidebar Configuration section**

In `src/components/layout/Sidebar.tsx`, update the Configuration section items:
```ts
{
  title: "Configuration",
  items: [
    { href: "/pricing-config", label: "Pricing Config" },
    { href: "/payment-config", label: "Payment Details" },
    { href: "/company-profile", label: "Company Profile" },
    { href: "/users", label: "Users" },
  ],
},
```

- [ ] **Step 2: Update PaymentConfig page upsert create to include companyProfileId**

In `src/app/(admin)/payment-config/page.tsx`, update the `create` in the upsert:
```tsx
  const config = await db.paymentConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyProfileId: 1,
      bank1Name: "EASTWEST BANK",
      bank1Holder: "JOLEO TRANSPORT",
      bank1Account: "200048853462",
      bank2Name: "BDO UNIBANK",
      bank2Holder: "JOLEO TRANSPORT",
      bank2Account: "013208001304",
      gcashHolder: "LEOVINA SALVADOR",
      gcashNumber: "09178305652",
    },
  });
```

---

## Task 11: `sendQuoteEmailAction` Server Action

**Files:**
- Create: `src/actions/email.ts`

- [ ] **Step 1: Create the email server action**

Create `src/actions/email.ts`:
```ts
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
```

---

## Task 12: SendEmailButton Client Component

**Files:**
- Create: `src/components/quotes/SendEmailButton.tsx`

- [ ] **Step 1: Create the SendEmailButton component**

Create `src/components/quotes/SendEmailButton.tsx`:
```tsx
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
              border: "1px solid var(--maroon)",
              color: canSend ? "var(--maroon)" : "var(--muted)",
              borderColor: canSend ? "var(--maroon)" : "var(--border)",
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
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
          />
          <AlertDialog.Content
            aria-describedby={undefined}
            style={{
              position: "fixed",
              top: "50%", left: "50%",
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
```

---

## Task 13: Update Quote Detail Page

**Files:**
- Modify: `src/app/(admin)/quotes/[id]/page.tsx`

- [ ] **Step 1: Add `email` to client select and `status` to booking select in the DB query**

In `src/app/(admin)/quotes/[id]/page.tsx`, update the `db.quote.findUnique` include:
```ts
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      client: { select: { clientName: true, contactPerson: true, email: true } },
      createdBy: { select: { username: true } },
      booking: { select: { bookingNo: true, id: true, status: true } },
    },
  });
```

- [ ] **Step 2: Add import for SendEmailButton**

Add at the top of the file (with other imports):
```ts
import { SendEmailButton } from "@/components/quotes/SendEmailButton";
```

- [ ] **Step 3: Add canSendEmail constant**

After the `hasOverride` line, add:
```ts
  const canSendEmail =
    !!quote.client?.email &&
    !!quote.booking &&
    ["CONFIRMED", "DISPATCHED", "COMPLETED"].includes(quote.booking.status);
```

- [ ] **Step 4: Add SendEmailButton to the PageHeader — place it between "Convert to Booking" and "Download PDF"**

In the `<PageHeader>` children, add after the Convert to Booking form and before the Download PDF link:
```tsx
        <SendEmailButton
          quoteId={quote.id}
          quoteNo={quote.quoteNo}
          clientEmail={quote.client?.email ?? null}
          canSend={canSendEmail}
        />
```

---

## Task 14: TypeScript Check + Tests

- [ ] **Step 1: Run TypeScript check**

```bash
cd /home/agent/projects/joleo-system && pnpm exec tsc --noEmit
```

Expected: 0 errors. Fix any type errors before continuing.

- [ ] **Step 2: Run tests**

```bash
cd /home/agent/projects/joleo-system && pnpm test --run
```

Expected: 30/30 pass. (No new tests — email/PDF generation are integration paths with no pure logic to unit test.)

- [ ] **Step 3: Commit**

```bash
cd /home/agent/projects/joleo-system && git add -A && git commit -m "feat: Send Email to Client — PDF quotation via Resend + CompanyProfile singleton

- CompanyProfile singleton model (phone/mobile/email/address for Joleo)
- PaymentConfig gains companyProfileId FK (1:1 with CompanyProfile)
- generateQuotePdf() shared utility extracted from PDF route
- sendQuoteEmailAction: guards booking status + client email, attaches PDF via Resend
- SendEmailButton: AlertDialog confirmation + inline success/error feedback
- /company-profile admin page (sidebar: Configuration → Company Profile)
- Button always visible on quote detail; disabled until booking CONFIRMED+

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** All requirements from the spec are covered — button disabled/enabled logic, AlertDialog confirmation, Resend integration, CompanyProfile singleton, PaymentConfig FK, admin page, sidebar entry, PDF shared utility.
- **No placeholders:** All code blocks are complete and runnable.
- **Type consistency:** `sendQuoteEmailAction(quoteId: string)` called from `SendEmailButton` with `quoteId: string` prop — consistent. `generateQuotePdf(quoteId: string): Promise<Buffer>` used in both route and email action — consistent.
- **Migration ordering:** Migration 1 creates CompanyProfile and inserts the row BEFORE migration 2 adds the FK — the FK constraint will find the row it references.
- **`@radix-ui/react-alert-dialog`:** Already installed (used in other dialogs). No new package needed beyond `resend`.
