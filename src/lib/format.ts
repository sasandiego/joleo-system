import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Manila";
const LOCALE = "en-PH";

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, "MMM d, yyyy h:mm a");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, "h:mm a");
}

export function todayManila(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyyMMdd");
}
