"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const routeAreaSchema = z.object({
  code: z.string().min(1).max(30),
  label: z.string().min(1),
  sampleDest: z.string().optional(),
  distanceMinKm: z.coerce.number().int().nonnegative(),
  distanceMaxKm: z.coerce.number().int().positive(),
  surcharge: z.coerce.number().nonnegative(),
  estimatedToll: z.coerce.number().nonnegative(),
  isLongDistance: z.boolean(),
  remarks: z.string().optional(),
});

export async function upsertRouteAreaAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const id = formData.get("id") as string | null;
  const isLongDistance = formData.get("isLongDistance") === "on";
  const raw = {
    code: formData.get("code"),
    label: formData.get("label"),
    sampleDest: formData.get("sampleDest") || undefined,
    distanceMinKm: formData.get("distanceMinKm"),
    distanceMaxKm: formData.get("distanceMaxKm"),
    surcharge: formData.get("surcharge"),
    estimatedToll: formData.get("estimatedToll"),
    isLongDistance,
    remarks: formData.get("remarks") || undefined,
  };
  const parsed = routeAreaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  try {
    if (id) {
      await db.routeArea.update({
        where: { id },
        data: {
          label: data.label,
          sampleDest: data.sampleDest ?? null,
          distanceMinKm: data.distanceMinKm,
          distanceMaxKm: data.distanceMaxKm,
          surcharge: data.surcharge,
          estimatedToll: data.estimatedToll,
          isLongDistance: data.isLongDistance,
          remarks: data.remarks ?? null,
        },
      });
    } else {
      await db.routeArea.create({
        data: {
          code: data.code.toUpperCase(),
          label: data.label,
          sampleDest: data.sampleDest ?? null,
          distanceMinKm: data.distanceMinKm,
          distanceMaxKm: data.distanceMaxKm,
          surcharge: data.surcharge,
          estimatedToll: data.estimatedToll,
          isLongDistance: data.isLongDistance,
          remarks: data.remarks ?? null,
        },
      });
    }
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") return { error: "A route area with that code already exists." };
    return { error: "Failed to save route area." };
  }
  revalidatePath("/route-areas");
  return { success: true };
}
