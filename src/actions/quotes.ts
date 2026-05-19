"use server";

import { auth } from "@/features/auth/config";
import { db } from "@/lib/db";
import { computePrice } from "@/features/pricing/engine";
import { todayManila } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { z } from "zod";

const quoteSchema = z.object({
  clientId: z.string().optional(),
  walkInName: z.string().optional(),
  serviceType: z.enum(["LIPAT_BAHAY", "COMMERCIAL_DELIVERY", "CATERING_DELIVERY", "OTHER"]),
  pickupPoint: z.string().min(1, "Pick-up point is required"),
  dropoffPoint: z.string().min(1, "Drop-off point is required"),
  routeAreaId: z.string().optional(),
  estimatedDistanceKm: z.coerce.number().int().min(1),
  estimatedHours: z.coerce.number().int().min(1),
  numberOfDropoffs: z.coerce.number().int().min(1).default(1),
  truckTypeId: z.string().min(1, "Truck type is required"),
  numberOfHelpers: z.coerce.number().int().min(0),
  includedHours: z.coerce.number().int().min(1),
  condoService: z.coerce.boolean().default(false),
  cateringService: z.coerce.boolean().default(false),
  nightDelivery: z.coerce.boolean().default(false),
  additionalHelper: z.coerce.boolean().default(false),
  outOfTown: z.coerce.boolean().default(false),
  longDistance: z.coerce.boolean().default(false),
  tollFee: z.coerce.number().min(0).default(0),
  parkingFee: z.coerce.number().min(0).default(0),
  fuelPriceOverride: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  vatOption: z.enum(["VAT_INCLUSIVE", "VAT_EXCLUSIVE", "NON_VAT"]),
  notes: z.string().optional(),
  convertToBooking: z.coerce.boolean().default(false),
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

export async function saveQuoteAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = quoteSchema.safeParse({
    ...raw,
    condoService: raw.condoService === "true",
    cateringService: raw.cateringService === "true",
    nightDelivery: raw.nightDelivery === "true",
    additionalHelper: raw.additionalHelper === "true",
    outOfTown: raw.outOfTown === "true",
    longDistance: raw.longDistance === "true",
    convertToBooking: raw.convertToBooking === "true",
    fuelPriceOverride:
      raw.fuelPriceOverride && raw.fuelPriceOverride !== "" ? raw.fuelPriceOverride : undefined,
    clientId: raw.clientId && raw.clientId !== "" ? raw.clientId : undefined,
    walkInName: raw.walkInName && raw.walkInName !== "" ? raw.walkInName : undefined,
    routeAreaId: raw.routeAreaId && raw.routeAreaId !== "" ? raw.routeAreaId : undefined,
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

  const pricingResult = computePrice(
    {
      estimatedDistanceKm: data.estimatedDistanceKm,
      estimatedJobHours: data.estimatedHours,
      includedHours: data.includedHours,
      numberOfHelpers: data.numberOfHelpers,
      numberOfDropoffs: data.numberOfDropoffs,
      condoService: data.condoService,
      cateringService: data.cateringService,
      nightDelivery: data.nightDelivery,
      additionalHelper: data.additionalHelper,
      outOfTown: data.outOfTown,
      longDistance: data.longDistance,
      tollFee: data.tollFee,
      parkingFee: data.parkingFee,
      fuelPriceOverride: data.fuelPriceOverride,
      discountAmount: data.discountAmount,
      vatOption: data.vatOption,
    },
    { truckType, settings }
  );

  const quoteNo = await generateQuoteNo();

  let quoteId: string;
  try {
    const quote = await db.quote.create({
      data: {
        quoteNo,
        status: "DRAFT",
        clientId: data.clientId ?? null,
        walkInName: data.walkInName ?? null,
        serviceType: data.serviceType,
        pickupPoint: data.pickupPoint,
        dropoffPoint: data.dropoffPoint,
        routeAreaId: data.routeAreaId ?? null,
        estimatedDistanceKm: data.estimatedDistanceKm,
        estimatedHours: data.estimatedHours,
        numberOfDropoffs: data.numberOfDropoffs,
        truckTypeId: data.truckTypeId,
        numberOfHelpers: data.numberOfHelpers,
        condoService: data.condoService,
        cateringService: data.cateringService,
        nightDelivery: data.nightDelivery,
        additionalHelper: data.additionalHelper,
        outOfTown: data.outOfTown,
        longDistance: data.longDistance,
        tollFee: new Decimal(data.tollFee),
        parkingFee: new Decimal(data.parkingFee),
        fuelPriceOverride: data.fuelPriceOverride ? new Decimal(data.fuelPriceOverride) : null,
        discountAmount: new Decimal(data.discountAmount),
        vatOption: data.vatOption,
        pricingSnapshot: pricingResult as object,
        finalPrice: new Decimal(pricingResult.finalPrice),
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
          clientId: data.clientId ?? null,
          walkInName: data.walkInName ?? null,
          scheduledDate: new Date(),
          pickupPoint: data.pickupPoint,
          dropoffPoint: data.dropoffPoint,
          estimatedDistanceKm: data.estimatedDistanceKm,
          routeAreaId: data.routeAreaId ?? null,
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
