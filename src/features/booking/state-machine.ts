import { BookingStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["QUOTED", "CANCELLED"],
  QUOTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: BookingStatus): BookingStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

export class BookingTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Cannot transition booking from ${from} to ${to}.`);
    this.name = "BookingTransitionError";
  }
}

export class BookingConflictError extends Error {
  constructor(truckCode: string, date: string, existingBookingNo: string) {
    super(`Truck ${truckCode} is already booked on ${date} (${existingBookingNo}).`);
    this.name = "BookingConflictError";
  }
}
