"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const resetPasswordSchema = z.object({
  userId: z.string().cuid(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPasswordAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated." };

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: msg };
  }

  const { userId, newPassword } = parsed.data;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PASSWORD_RESET",
      entityType: "User",
      entityId: userId,
    },
  });

  revalidatePath("/users");
  return { success: true };
}
