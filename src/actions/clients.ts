"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const clientSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  email: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email().optional()),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export async function upsertClientAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  const raw = {
    companyName: formData.get("companyName"),
    contactPerson: formData.get("contactPerson") || undefined,
    mobile: formData.get("mobile") || undefined,
    email: formData.get("email") || "",
    paymentTerms: formData.get("paymentTerms") || undefined,
    notes: formData.get("notes") || undefined,
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  try {
    if (id) {
      await db.client.update({
        where: { id },
        data: {
          companyName: data.companyName,
          contactPerson: data.contactPerson ?? null,
          mobile: data.mobile ?? null,
          email: data.email ?? null,
          paymentTerms: data.paymentTerms ?? null,
          notes: data.notes ?? null,
        },
      });
    } else {
      await db.client.create({
        data: {
          companyName: data.companyName,
          contactPerson: data.contactPerson ?? null,
          mobile: data.mobile ?? null,
          email: data.email ?? null,
          paymentTerms: data.paymentTerms ?? null,
          notes: data.notes ?? null,
        },
      });
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
