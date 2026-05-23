"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Sequential auto-generated client code: CL-0001, CL-0002, …
// Looks up the highest existing CL-NNNN and increments; never reuses gaps.
async function generateClientCode(): Promise<string> {
  const last = await db.client.findFirst({
    where: { clientCode: { startsWith: "CL-" } },
    orderBy: { clientCode: "desc" },
    select: { clientCode: true },
  });
  const lastNum = last?.clientCode ? parseInt(last.clientCode.slice(3), 10) || 0 : 0;
  return `CL-${String(lastNum + 1).padStart(4, "0")}`;
}

// PH mobile: optional +63/63/0 prefix then 9 + 9 digits, allowing spaces/hyphens as separators.
// Matches: 09171234567, 0917-123-4567, 0917 123 4567, +639171234567, 639171234567
const PH_MOBILE_RE = /^(?:\+?63|0)9(?:[\s-]?\d){9}$/;

// PH landline: any combination of digits / spaces / hyphens / plus / parentheses,
// total length 7–18 chars. Loose on purpose — PH landline formats vary widely.
// (Metro Manila 8-digit, provincial area-code + 7-digit, international with +63 prefix, etc.)
const PH_LANDLINE_RE = /^[\d\s\-+()]{7,18}$/;

const optionalRegex = (re: RegExp, message: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || re.test(v), { message });

const clientSchema = z.object({
  clientName: z.string().min(1),
  type: z.enum(["INDIVIDUAL_PERSON", "INDIVIDUAL_BUSINESS", "CORPORATION_BUSINESS"]).default("INDIVIDUAL_BUSINESS"),
  contactPerson: z.string().optional(),
  mobile: optionalRegex(PH_MOBILE_RE, "Mobile must be a PH number (e.g. 0917-123-4567 or +639171234567)."),
  landline: optionalRegex(PH_LANDLINE_RE, "Landline must be a valid phone number (digits, spaces, dashes, or parentheses)."),
  email: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email().optional()),
  tin: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export async function upsertClientAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  const raw = {
    clientName: formData.get("clientName"),
    type: formData.get("type") || "INDIVIDUAL_BUSINESS",
    contactPerson: formData.get("contactPerson") || undefined,
    mobile: formData.get("mobile") || undefined,
    landline: formData.get("landline") || undefined,
    email: formData.get("email") || "",
    tin: formData.get("tin") || undefined,
    address: formData.get("address") || undefined,
    paymentTerms: formData.get("paymentTerms") || undefined,
    notes: formData.get("notes") || undefined,
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  try {
    const clientData = {
      clientName: data.clientName,
      type: data.type,
      contactPerson: data.contactPerson ?? null,
      mobile: data.mobile ?? null,
      landline: data.landline ?? null,
      email: data.email ?? null,
      tin: data.tin ?? null,
      address: data.address ?? null,
      paymentTerms: data.paymentTerms ?? null,
      notes: data.notes ?? null,
    };
    if (id) {
      // Update: clientCode is system-managed, never modified after creation.
      await db.client.update({ where: { id }, data: clientData });
    } else {
      const clientCode = await generateClientCode();
      await db.client.create({ data: { ...clientData, clientCode } });
    }
  } catch {
    return { error: "Failed to save client." };
  }
  revalidatePath("/clients");
  return { success: true };
}

export async function toggleClientStatusAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  if (!id) return { error: "Missing client ID." };
  try {
    const client = await db.client.findUnique({ where: { id } });
    if (!client) return { error: "Client not found." };
    await db.client.update({
      where: { id },
      data: { isActive: !client.isActive },
    });
  } catch {
    return { error: "Failed to update client status." };
  }
  revalidatePath("/clients");
  return { success: true };
}
