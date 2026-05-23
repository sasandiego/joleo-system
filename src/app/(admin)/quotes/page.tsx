import { db } from "@/lib/db";
import { QuoteListClient } from "@/components/quotes/QuoteListClient";

export default async function QuotesPage() {
  const quotes = await db.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { clientName: true } },
      createdBy: { select: { username: true } },
    },
  });

  const serialized = quotes.map((q) => ({
    id: q.id,
    quoteNo: q.quoteNo,
    status: q.status,
    clientName: q.client?.clientName ?? q.walkInName ?? "Walk-in",
    finalPrice: q.finalPrice.toNumber(),
    createdAt: q.createdAt.toISOString(),
    createdBy: q.createdBy.username,
    scheduledDate: q.scheduledDate?.toISOString() ?? null,
    scheduledStartTime: q.scheduledStartTime ?? null,
  }));

  return <QuoteListClient quotes={serialized} />;
}
