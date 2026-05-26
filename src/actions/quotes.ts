"use server";

import { auth } from "@/features/auth/config";
import { db } from "@/lib/db";
import { computePrice } from "@/features/pricing/engine";
import { todayManila } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { z } from "zod";

// Shared schema for both create and update.
const quoteSchema = z.object({
  clientId: z.string().min(1, "Please select a client. Create a client profile first if needed."),
  serviceType: z.enum(["LIPAT_BAHAY", "COMMERCIAL_DELIVERY", "CATERING_DELIVERY", "OTHER"]),
  pickupPoint: z.string().min(1, "Pick-up point is required"),
  dropoffPoint: z.string().min(1, "Drop-off point is required"),
  routeAreaId: z.string().optional(),
  estimatedDistanceKm: z.coerce.number().int().min(1),
  estimatedHours: z.coerce.number().int().min(1),
  numberOfDropoffs: z.coerce.number().int().min(1).default(1),
  truckTypeId: z.string().min(1, "Truck type is required"),
  numberOfHelpers: z.coerce.number().int().min(1, "At least 1 helper is required"),
  tripBillingType: z.enum(["EIGHT_HOUR", "PER_TRIP"]),
  difficultAccess: z.coerce.boolean().default(false),
  cateringService: z.coerce.boolean().default(false),
  tollFee: z.coerce.number().min(0).default(0),
  fuelPriceOverride: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  manualOverridePrice: z.coerce.number().min(0).optional(),
  vatOption: z.enum(["VAT_INCLUSIVE", "VAT_EXCLUSIVE", "NON_VAT"]),
  serviceDescription: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledStartTime: z.string().optional(),
  convertToBooking: z.coerce.boolean().default(false),
});

const updateSchema = quoteSchema.extend({
  id: z.string().min(1, "Quote ID required"),
});

async function generateQuoteNo(): Promise<string> {
  const today = todayManila();
  const count = await db.quote.count({
    where: { quoteNo: { startsWith: `QT-${today}-` } },
  });
  return `QT-${today}-${String(count + 1).padStart(4, "0")}`;
}

async function generateBookingNo(): Promise<string> {
  const today = todayManila();
  const count = await db.booking.count({
    where: { bookingNo: { startsWith: `JOL-${today}-` } },
  });
  return `JOL-${today}-${String(count + 1).padStart(4, "0")}`;
}

function coerceBool(v: FormDataEntryValue | undefined | null): boolean {
  return v === "true" || v === "on";
}

function emptyToUndefined(v: FormDataEntryValue | undefined | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v);
  return s === "" ? undefined : s;
}

export async function saveQuoteAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = quoteSchema.safeParse({
    ...raw,
    difficultAccess: coerceBool(raw.difficultAccess),
    cateringService: coerceBool(raw.cateringService),
    convertToBooking: coerceBool(raw.convertToBooking),
    fuelPriceOverride: emptyToUndefined(raw.fuelPriceOverride),
    manualOverridePrice: emptyToUndefined(raw.manualOverridePrice),
    clientId: emptyToUndefined(raw.clientId),
    routeAreaId: emptyToUndefined(raw.routeAreaId),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;

  const [truckType, settings] = await Promise.all([
    db.truckType.findUnique({ where: { id: data.truckTypeId } }),
    db.rateSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!truckType) return { error: "Truck type not found." };
  if (!settings) return { error: "Rate settings not found." };

  let pricingResult;
  try {
    pricingResult = computePrice(
      {
        estimatedDistanceKm: data.estimatedDistanceKm,
        estimatedJobHours: data.estimatedHours,
        tripBillingType: data.tripBillingType,
        numberOfHelpers: data.numberOfHelpers,
        numberOfDropoffs: data.numberOfDropoffs,
        difficultAccess: data.difficultAccess,
        cateringService: data.cateringService,
        tollFee: data.tollFee,
        fuelPriceOverride: data.fuelPriceOverride,
        discountAmount: data.discountAmount,
        manualOverridePrice: data.manualOverridePrice,
        vatOption: data.vatOption,
      },
      { truckType, settings },
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  const quoteNo = await generateQuoteNo();

  let quoteId: string;
  try {
    const quote = await db.quote.create({
      data: {
        quoteNo,
        status: "DRAFT",
        clientId: data.clientId,
        serviceType: data.serviceType,
        pickupPoint: data.pickupPoint,
        dropoffPoint: data.dropoffPoint,
        routeAreaId: data.routeAreaId ?? null,
        estimatedDistanceKm: data.estimatedDistanceKm,
        estimatedHours: data.estimatedHours,
        numberOfDropoffs: data.numberOfDropoffs,
        truckTypeId: data.truckTypeId,
        numberOfHelpers: data.numberOfHelpers,
        tripBillingType: data.tripBillingType,
        difficultAccess: data.difficultAccess,
        cateringService: data.cateringService,
        tollFee: new Decimal(data.tollFee),
        fuelPriceOverride: data.fuelPriceOverride ? new Decimal(data.fuelPriceOverride) : null,
        discountAmount: new Decimal(data.discountAmount),
        vatOption: data.vatOption,
        pricingSnapshot: pricingResult as object,
        finalPrice: new Decimal(pricingResult.finalPrice),
        manualOverridePrice: data.manualOverridePrice ? new Decimal(data.manualOverridePrice) : null,
        serviceDescription: data.serviceDescription ?? null,
        notes: data.notes ?? null,
        paymentTerms: data.paymentTerms ?? null,
        scheduledDate: new Date(data.scheduledDate),
        scheduledStartTime: data.scheduledStartTime || null,
        createdById: session.user.id,
      },
    });
    quoteId = quote.id;

    if (data.convertToBooking) {
      const bookingNo = await generateBookingNo();
      await db.booking.create({
        data: {
          bookingNo,
          status: "DRAFT",
          quoteId: quoteId,
          clientId: data.clientId,
          scheduledDate: new Date(data.scheduledDate),
          scheduledStartTime: data.scheduledStartTime || null,
          pickupPoint: data.pickupPoint,
          dropoffPoint: data.dropoffPoint,
          estimatedDistanceKm: data.estimatedDistanceKm,
          routeAreaId: data.routeAreaId ?? null,
          tripBillingType: data.tripBillingType,
          quotedAmount: new Decimal(pricingResult.finalPrice),
          createdById: session.user.id,
        },
      });
    }
  } catch (e) {
    return mapDbError(e, "save quote");
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quoteId}`);
}

// Translate a Prisma error into a user-facing message, logging the raw error.
// P2003 = FK constraint violation; createdById FK violation almost always means
// the user's JWT references a stale user.id (e.g. after a reseed).
function mapDbError(e: unknown, op: string): { error: string } {
  const err = e as { code?: string; meta?: { field_name?: string } };
  if (err.code === "P2003") {
    const field = err.meta?.field_name ?? "";
    console.error(`P2003 on ${op}:`, err.meta);
    if (field.includes("createdById")) {
      return {
        error:
          "Your sign-in session is no longer valid (the user account it refers to is missing). Please log out and log back in, then retry.",
      };
    }
    return { error: `Reference missing on ${op}: ${field || "unknown FK"}.` };
  }
  console.error(`Failed to ${op}:`, e);
  return { error: `Failed to ${op}. Please retry; if this persists, contact admin.` };
}

export async function updateQuoteAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateSchema.safeParse({
    ...raw,
    difficultAccess: coerceBool(raw.difficultAccess),
    cateringService: coerceBool(raw.cateringService),
    convertToBooking: false, // not supported on edit
    fuelPriceOverride: emptyToUndefined(raw.fuelPriceOverride),
    manualOverridePrice: emptyToUndefined(raw.manualOverridePrice),
    clientId: emptyToUndefined(raw.clientId),
    routeAreaId: emptyToUndefined(raw.routeAreaId),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;

  const [existing, truckType, settings] = await Promise.all([
    db.quote.findUnique({ where: { id: data.id } }),
    db.truckType.findUnique({ where: { id: data.truckTypeId } }),
    db.rateSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!existing) return { error: "Quote not found." };
  if (!truckType) return { error: "Truck type not found." };
  if (!settings) return { error: "Rate settings not found." };

  let pricingResult;
  try {
    pricingResult = computePrice(
      {
        estimatedDistanceKm: data.estimatedDistanceKm,
        estimatedJobHours: data.estimatedHours,
        tripBillingType: data.tripBillingType,
        numberOfHelpers: data.numberOfHelpers,
        numberOfDropoffs: data.numberOfDropoffs,
        difficultAccess: data.difficultAccess,
        cateringService: data.cateringService,
        tollFee: data.tollFee,
        fuelPriceOverride: data.fuelPriceOverride,
        discountAmount: data.discountAmount,
        manualOverridePrice: data.manualOverridePrice,
        vatOption: data.vatOption,
      },
      { truckType, settings },
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  try {
    await db.quote.update({
      where: { id: data.id },
      data: {
        clientId: data.clientId,
        serviceType: data.serviceType,
        pickupPoint: data.pickupPoint,
        dropoffPoint: data.dropoffPoint,
        routeAreaId: data.routeAreaId ?? null,
        estimatedDistanceKm: data.estimatedDistanceKm,
        estimatedHours: data.estimatedHours,
        numberOfDropoffs: data.numberOfDropoffs,
        truckTypeId: data.truckTypeId,
        numberOfHelpers: data.numberOfHelpers,
        tripBillingType: data.tripBillingType,
        difficultAccess: data.difficultAccess,
        cateringService: data.cateringService,
        tollFee: new Decimal(data.tollFee),
        fuelPriceOverride: data.fuelPriceOverride ? new Decimal(data.fuelPriceOverride) : null,
        discountAmount: new Decimal(data.discountAmount),
        vatOption: data.vatOption,
        pricingSnapshot: pricingResult as object,
        finalPrice: new Decimal(pricingResult.finalPrice),
        manualOverridePrice: data.manualOverridePrice ? new Decimal(data.manualOverridePrice) : null,
        serviceDescription: data.serviceDescription ?? null,
        notes: data.notes ?? null,
        paymentTerms: data.paymentTerms ?? null,
        scheduledDate: new Date(data.scheduledDate),
        scheduledStartTime: data.scheduledStartTime || null,
      },
    });

    // Audit log: capture what changed (before/after summaries)
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "QUOTE_UPDATED",
        entityType: "Quote",
        entityId: data.id,
        before: {
          finalPrice: existing.finalPrice.toNumber(),
          manualOverridePrice: existing.manualOverridePrice?.toNumber() ?? null,
          estimatedDistanceKm: existing.estimatedDistanceKm,
          estimatedHours: existing.estimatedHours,
          tripBillingType: existing.tripBillingType,
          truckTypeId: existing.truckTypeId,
          pickupPoint: existing.pickupPoint,
          dropoffPoint: existing.dropoffPoint,
          serviceDescription: existing.serviceDescription,
        },
        after: {
          finalPrice: pricingResult.finalPrice,
          manualOverridePrice: data.manualOverridePrice ?? null,
          estimatedDistanceKm: data.estimatedDistanceKm,
          estimatedHours: data.estimatedHours,
          tripBillingType: data.tripBillingType,
          truckTypeId: data.truckTypeId,
          pickupPoint: data.pickupPoint,
          dropoffPoint: data.dropoffPoint,
          serviceDescription: data.serviceDescription ?? null,
        },
      },
    });
  } catch (e) {
    return mapDbError(e, "update quote");
  }

  revalidatePath(`/quotes/${data.id}`);
  redirect(`/quotes/${data.id}`);
}

export async function convertQuoteToBookingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");

  const quoteId = formData.get("quoteId") as string | null;
  if (!quoteId) throw new Error("Quote ID required.");

  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: { booking: { select: { id: true } } },
  });
  if (!quote) throw new Error("Quote not found.");
  if (quote.booking) {
    // Already converted — just send the user to the existing booking.
    redirect(`/bookings/${quote.booking.id}`);
  }
  if (!quote.scheduledDate) {
    throw new Error("Quote is missing a scheduled date. Edit the quote to add one before converting.");
  }

  const bookingNo = await generateBookingNo();
  const booking = await db.booking.create({
    data: {
      bookingNo,
      status: "DRAFT",
      quoteId: quote.id,
      clientId: quote.clientId,
      scheduledDate: quote.scheduledDate,
      scheduledStartTime: quote.scheduledStartTime,
      pickupPoint: quote.pickupPoint,
      dropoffPoint: quote.dropoffPoint,
      estimatedDistanceKm: quote.estimatedDistanceKm,
      routeAreaId: quote.routeAreaId,
      tripBillingType: quote.tripBillingType,
      quotedAmount: quote.finalPrice,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath("/bookings");
  redirect(`/bookings/${booking.id}`);
}
