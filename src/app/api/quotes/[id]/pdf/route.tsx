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
      client: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) return new Response("Not found", { status: 404 });

  const [truckType, routeArea] = await Promise.all([
    quote.truckTypeId
      ? db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
      : null,
    quote.routeAreaId
      ? db.routeArea.findUnique({ where: { id: quote.routeAreaId }, select: { label: true } })
      : null,
  ]);

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      <QuotationPDF
        quoteNo={quote.quoteNo}
        status={quote.status}
        clientName={quote.client?.companyName ?? quote.walkInName ?? "Walk-in"}
        contactPerson={quote.client?.contactPerson ?? null}
        serviceType={quote.serviceType}
        pickupPoint={quote.pickupPoint}
        dropoffPoint={quote.dropoffPoint}
        routeArea={routeArea?.label ?? null}
        truckType={truckType?.label ?? null}
        pricing={pricing}
        createdAt={formatDate(quote.createdAt)}
        createdBy={quote.createdBy.username}
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
