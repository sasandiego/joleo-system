"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  bank1Name:    z.string().min(1, "Bank 1 name is required"),
  bank1Holder:  z.string().min(1, "Bank 1 account holder is required"),
  bank1Account: z.string().min(1, "Bank 1 account number is required"),
  bank2Name:    z.string().min(1, "Bank 2 name is required"),
  bank2Holder:  z.string().min(1, "Bank 2 account holder is required"),
  bank2Account: z.string().min(1, "Bank 2 account number is required"),
  gcashHolder:  z.string().min(1, "GCash name is required"),
  gcashNumber:  z.string().min(1, "GCash number is required"),
});

export async function updatePaymentConfigAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const data = parsed.data;
  await db.paymentConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  revalidatePath("/payment-config");
  return { success: true };
}
