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
