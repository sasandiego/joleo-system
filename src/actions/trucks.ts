"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const truckSchema = z.object({
  code: z.string().min(1).max(10),
  plateNo: z.string().min(1),
  truckTypeId: z.string().cuid(),
  status: z.enum(["ACTIVE", "UNDER_REPAIR", "INACTIVE"]),
  remarks: z.string().optional(),
});

export async function upsertTruckAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  const raw = {
    code: formData.get("code"),
    plateNo: formData.get("plateNo"),
    truckTypeId: formData.get("truckTypeId"),
    status: formData.get("status"),
    remarks: formData.get("remarks") || undefined,
  };
  const parsed = truckSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  try {
    if (id) {
      await db.truck.update({
        where: { id },
        data: {
          plateNo: data.plateNo,
          truckTypeId: data.truckTypeId,
          status: data.status,
          remarks: data.remarks ?? null,
        },
      });
    } else {
      await db.truck.create({
        data: {
          code: data.code,
          plateNo: data.plateNo,
          truckTypeId: data.truckTypeId,
          status: data.status,
          remarks: data.remarks ?? null,
        },
      });
    }
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "A truck with that code or plate number already exists." };
    return { error: "Failed to save truck." };
  }
  revalidatePath("/trucks");
  return { success: true };
}
