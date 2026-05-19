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
      client: { select: { companyName: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) return new Response("Not found", { status: 404 });

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  const pdfBuffer = await renderToBuffer(
    <QuotationPDF
      quoteNo={quote.quoteNo}
      status={quote.status}
      clientName={quote.client?.companyName ?? quote.walkInName ?? "Walk-in"}
      serviceType={quote.serviceType}
      pickupPoint={quote.pickupPoint}
      dropoffPoint={quote.dropoffPoint}
      pricing={pricing}
      createdAt={formatDate(quote.createdAt)}
      createdBy={quote.createdBy.username}
    />
  );

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNo}.pdf"`,
    },
  });
}
