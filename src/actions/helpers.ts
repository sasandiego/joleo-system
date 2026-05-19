"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const helperSchema = z.object({
  employeeId: z.string().min(1),
  fullName: z.string().min(1),
  dailyRate: z.coerce.number().positive(),
  otRate: z.coerce.number().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  remarks: z.string().optional(),
});

export async function upsertHelperAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  const raw = {
    employeeId: formData.get("employeeId"),
    fullName: formData.get("fullName"),
    dailyRate: formData.get("dailyRate"),
    otRate: formData.get("otRate"),
    status: formData.get("status"),
    remarks: formData.get("remarks") || undefined,
  };
  const parsed = helperSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  try {
    if (id) {
      await db.helper.update({
        where: { id },
        data: {
          fullName: data.fullName,
          dailyRate: data.dailyRate,
          otRate: data.otRate,
          status: data.status,
          remarks: data.remarks ?? null,
        },
      });
    } else {
      await db.helper.create({
        data: {
          employeeId: data.employeeId,
          fullName: data.fullName,
          dailyRate: data.dailyRate,
          otRate: data.otRate,
          status: data.status,
          remarks: data.remarks ?? null,
        },
      });
    }
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "A helper with that Employee ID already exists." };
    return { error: "Failed to save helper." };
  }
  revalidatePath("/helpers");
  return { success: true };
}
