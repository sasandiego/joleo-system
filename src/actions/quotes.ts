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
  numberOfHelpers: z.coerce.number().int().min(0),
  tripBillingType: z.enum(["EIGHT_HOUR", "PER_TRIP"]),
  condoService: z.coerce.boolean().default(false),
  cateringService: z.coerce.boolean().default(false),
  additionalHelper: z.coerce.boolean().default(false),
  tollFee: z.coerce.number().min(0).default(0),
  fuelPriceOverride: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  manualOverridePrice: z.coerce.number().min(0).optional(),
  vatOption: z.enum(["VAT_INCLUSIVE", "VAT_EXCLUSIVE", "NON_VAT"]),
  notes: z.string().optional(),
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
    condoService: coerceBool(raw.condoService),
    cateringService: coerceBool(raw.cateringService),
    additionalHelper: coerceBool(raw.additionalHelper),
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
        numberOfDropoffs: data.numberOfDropoffs,
        condoService: data.condoService,
        cateringService: data.cateringService,
        additionalHelper: data.additionalHelper,
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
        condoService: data.condoService,
        cateringService: data.cateringService,
        additionalHelper: data.additionalHelper,
        tollFee: new Decimal(data.tollFee),
        fuelPriceOverride: data.fuelPriceOverride ? new Decimal(data.fuelPriceOverride) : null,
        discountAmount: new Decimal(data.discountAmount),
        vatOption: data.vatOption,
        pricingSnapshot: pricingResult as object,
        finalPrice: new Decimal(pricingResult.finalPrice),
        manualOverridePrice: data.manualOverridePrice ? new Decimal(data.manualOverridePrice) : null,
        notes: data.notes ?? null,
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
          scheduledDate: new Date(),
          pickupPoint: data.pickupPoint,
          dropoffPoint: data.dropoffPoint,
          estimatedDistanceKm: data.estimatedDistanceKm,
          routeAreaId: data.routeAreaId ?? null,
          tripBillingType: data.tripBillingType,
          quotedAmount: new Decimal(pricingResult.finalPrice),
          notes: data.notes ?? null,
          createdById: session.user.id,
        },
      });
    }
  } catch {
    return { error: "Failed to save quote." };
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quoteId}`);
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
    condoService: coerceBool(raw.condoService),
    cateringService: coerceBool(raw.cateringService),
    additionalHelper: coerceBool(raw.additionalHelper),
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
        numberOfDropoffs: data.numberOfDropoffs,
        condoService: data.condoService,
        cateringService: data.cateringService,
        additionalHelper: data.additionalHelper,
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
        condoService: data.condoService,
        cateringService: data.cateringService,
        additionalHelper: data.additionalHelper,
        tollFee: new Decimal(data.tollFee),
        fuelPriceOverride: data.fuelPriceOverride ? new Decimal(data.fuelPriceOverride) : null,
        discountAmount: new Decimal(data.discountAmount),
        vatOption: data.vatOption,
        pricingSnapshot: pricingResult as object,
        finalPrice: new Decimal(pricingResult.finalPrice),
        manualOverridePrice: data.manualOverridePrice ? new Decimal(data.manualOverridePrice) : null,
        notes: data.notes ?? null,
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
          notes: existing.notes,
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
          notes: data.notes ?? null,
        },
      },
    });
  } catch {
    return { error: "Failed to update quote." };
  }

  revalidatePath(`/quotes/${data.id}`);
  redirect(`/quotes/${data.id}`);
}
