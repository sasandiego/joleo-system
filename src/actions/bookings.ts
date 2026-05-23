"use server";

import { auth } from "@/features/auth/config";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { canTransition, BookingTransitionError, BookingConflictError } from "@/features/booking/state-machine";
import { BookingStatus } from "@prisma/client";
import { todayManila } from "@/lib/format";
import { z } from "zod";
import Decimal from "decimal.js";

async function checkDriverConflict(driverId: string, date: Date, excludeBookingId?: string) {
  const driver = await db.driver.findUnique({
    where: { id: driverId },
    select: { fullName: true, status: true },
  });
  if (!driver) throw new Error("Driver not found.");
  if (driver.status !== "ACTIVE") throw new Error(`Driver ${driver.fullName} is not active.`);

  const dateStr = date.toISOString().slice(0, 10);
  const conflict = await db.booking.findFirst({
    where: {
      driverId,
      scheduledDate: date,
      status: { notIn: ["CANCELLED"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { bookingNo: true },
  });

  if (conflict) {
    throw new Error(
      `Driver ${driver.fullName} is already assigned to booking ${conflict.bookingNo} on ${dateStr}.`
    );
  }
}

async function checkTruckConflict(truckId: string, date: Date, excludeBookingId?: string) {
  const truck = await db.truck.findUnique({
    where: { id: truckId },
    select: { code: true, status: true },
  });
  if (!truck) throw new Error("Truck not found.");
  if (truck.status !== "ACTIVE") throw new Error(`Truck ${truck.code} is not active.`);

  const dateStr = date.toISOString().slice(0, 10);
  const conflict = await db.booking.findFirst({
    where: {
      truckId,
      scheduledDate: date,
      status: { notIn: ["CANCELLED"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { bookingNo: true },
  });

  if (conflict) {
    throw new BookingConflictError(truck.code, dateStr, conflict.bookingNo);
  }
}

// ── Transition booking status ─────────────────────────────────────────────────

export async function transitionBookingAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const bookingId = formData.get("bookingId") as string;
  const toStatus = formData.get("toStatus") as BookingStatus;
  const cancelReason = (formData.get("cancelReason") as string) || undefined;

  if (!bookingId || !toStatus) return { error: "Missing required fields." };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, bookingNo: true, truckId: true, scheduledDate: true },
  });
  if (!booking) return { error: "Booking not found." };

  if (!canTransition(booking.status, toStatus)) {
    return { error: new BookingTransitionError(booking.status, toStatus).message };
  }

  // Conflict checks when confirming
  if (toStatus === "CONFIRMED" && booking.scheduledDate) {
    try {
      if (booking.truckId) await checkTruckConflict(booking.truckId, booking.scheduledDate, bookingId);
      const fullBooking = await db.booking.findUnique({ where: { id: bookingId }, select: { driverId: true } });
      if (fullBooking?.driverId) await checkDriverConflict(fullBooking.driverId, booking.scheduledDate, bookingId);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: toStatus,
          cancelReason: toStatus === "CANCELLED" ? (cancelReason ?? null) : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "BOOKING_STATUS_CHANGED",
          entityType: "Booking",
          entityId: bookingId,
          before: { status: booking.status },
          after: { status: toStatus, cancelReason },
        },
      });
    });
  } catch {
    return { error: "Failed to update booking status." };
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/calendar");
  return { success: true };
}

// ── Update booking assignment (truck, driver, helpers, schedule) ──────────────

const assignSchema = z.object({
  bookingId: z.string().min(1),
  truckId: z.string().optional(),
  driverId: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  notes: z.string().optional(),
  recomputedAmount: z.coerce.number().positive().optional(),
});

export async function updateBookingAssignmentAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = assignSchema.safeParse({
    ...raw,
    truckId: raw.truckId || undefined,
    driverId: raw.driverId || undefined,
    scheduledDate: raw.scheduledDate || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const data = parsed.data;
  const booking = await db.booking.findUnique({
    where: { id: data.bookingId },
    select: {
      status: true,
      scheduledDate: true,
      quotedAmount: true,
      truck: { select: { truckType: { select: { label: true } } } },
    },
  });
  if (!booking) return { error: "Booking not found." };
  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    return { error: "Cannot modify a completed or cancelled booking." };
  }

  const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;

  // Conflict checks when assigning truck / driver + date
  if (scheduledDate) {
    try {
      if (data.truckId) await checkTruckConflict(data.truckId, scheduledDate, data.bookingId);
      if (data.driverId) await checkDriverConflict(data.driverId, scheduledDate, data.bookingId);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  // Look up new truck type label + current username for audit log
  const newTruck = data.truckId && data.recomputedAmount !== undefined
    ? await db.truck.findUnique({
        where: { id: data.truckId },
        select: { truckType: { select: { label: true } } },
      })
    : null;
  const actingUser = data.recomputedAmount !== undefined
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    : null;

  // Parse helper IDs from formData (multi-value)
  const helperIds = formData.getAll("helperId") as string[];

  try {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: data.bookingId },
        data: {
          truckId: data.truckId ?? null,
          driverId: data.driverId ?? null,
          scheduledDate: scheduledDate ?? undefined,
          scheduledStartTime: data.scheduledStartTime ?? null,
          scheduledEndTime: data.scheduledEndTime ?? null,
          notes: data.notes ?? null,
          ...(data.recomputedAmount !== undefined
            ? { quotedAmount: new Decimal(data.recomputedAmount) }
            : {}),
        },
      });

      if (helperIds.length > 0) {
        await tx.bookingHelper.deleteMany({ where: { bookingId: data.bookingId } });
        await tx.bookingHelper.createMany({
          data: helperIds.map((helperId) => ({ bookingId: data.bookingId, helperId })),
        });
      }

      if (data.recomputedAmount !== undefined) {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_PRICE_UPDATED",
            entityType: "Booking",
            entityId: data.bookingId,
            before: {
              quotedAmount: booking.quotedAmount.toNumber(),
              truckType: booking.truck?.truckType?.label ?? null,
            },
            after: {
              quotedAmount: data.recomputedAmount,
              truckType: newTruck?.truckType?.label ?? null,
              username: actingUser?.username ?? session.user.id,
            },
          },
        });
      }
    });
  } catch {
    return { error: "Failed to update booking." };
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${data.bookingId}`);
  revalidatePath("/calendar");
  return { success: true };
}

// ── Create standalone booking (not from quote) ────────────────────────────────

const createBookingSchema = z.object({
  clientId: z.string().min(1, "Please select a client. Create a client profile first if needed."),
  pickupPoint: z.string().min(1, "Pick-up point is required"),
  dropoffPoint: z.string().min(1, "Drop-off point is required"),
  estimatedDistanceKm: z.coerce.number().int().min(1),
  tripBillingType: z.enum(["EIGHT_HOUR", "PER_TRIP"]).default("EIGHT_HOUR"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  truckId: z.string().optional(),
  driverId: z.string().optional(),
  quotedAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

async function generateBookingNo(): Promise<string> {
  const today = todayManila();
  const count = await db.booking.count({
    where: { bookingNo: { startsWith: `JOL-${today}-` } },
  });
  return `JOL-${today}-${String(count + 1).padStart(4, "0")}`;
}

export async function createBookingAction(
  _prev: { error?: string; success?: boolean; bookingId?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createBookingSchema.safeParse({
    ...raw,
    clientId: raw.clientId || undefined,
    truckId: raw.truckId || undefined,
    driverId: raw.driverId || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const data = parsed.data;
  const scheduledDate = new Date(data.scheduledDate);

  try {
    if (data.truckId) await checkTruckConflict(data.truckId, scheduledDate);
    if (data.driverId) await checkDriverConflict(data.driverId, scheduledDate);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const bookingNo = await generateBookingNo();

  try {
    const booking = await db.booking.create({
      data: {
        bookingNo,
        status: "DRAFT",
        clientId: data.clientId,
        scheduledDate,
        pickupPoint: data.pickupPoint,
        dropoffPoint: data.dropoffPoint,
        estimatedDistanceKm: data.estimatedDistanceKm,
        tripBillingType: data.tripBillingType,
        truckId: data.truckId ?? null,
        driverId: data.driverId ?? null,
        quotedAmount: new Decimal(data.quotedAmount),
        notes: data.notes ?? null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/bookings");
    revalidatePath("/calendar");
    return { success: true, bookingId: booking.id };
  } catch {
    return { error: "Failed to create booking." };
  }
}
