import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import type { PricingResult } from "@/features/pricing/types";
import { formatDate } from "@/lib/format";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      client: { select: { clientName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) return new Response("Not found", { status: 404 });

  const truckType = quote.truckTypeId
    ? await db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
    : null;

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      <QuotationPDF
        quoteNo={quote.quoteNo}
        status={quote.status}
        clientName={quote.client?.clientName ?? quote.walkInName ?? "Walk-in"}
        contactPerson={quote.client?.contactPerson ?? null}
        serviceType={quote.serviceType}
        pickupPoint={quote.pickupPoint}
        dropoffPoint={quote.dropoffPoint}
        scheduledDate={quote.scheduledDate ? formatDate(quote.scheduledDate) : null}
        scheduledStartTime={quote.scheduledStartTime}
        truckType={truckType?.label ?? null}
        numberOfHelpers={quote.numberOfHelpers}
        pricing={pricing}
        createdAt={formatDate(quote.createdAt)}
        createdBy={quote.createdBy.username}
        serviceDescription={quote.serviceDescription}
      />
    );
  } catch (err) {
    console.error("[PDF] renderToBuffer failed:", err);
    return new Response(`PDF generation failed: ${String(err)}`, { status: 500 });
  }

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNo}.pdf"`,
    },
  });
}
