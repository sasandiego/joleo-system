import React from "react";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import type { PricingResult } from "@/features/pricing/types";
import { formatDate } from "@/lib/format";

export async function generateQuotePdf(quoteId: string): Promise<Buffer> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: { select: { clientName: true, contactPerson: true } },
      createdBy: { select: { username: true } },
    },
  });

  if (!quote) throw new Error(`Quote ${quoteId} not found`);

  const [truckType, paymentConfig] = await Promise.all([
    quote.truckTypeId
      ? db.truckType.findUnique({ where: { id: quote.truckTypeId }, select: { label: true } })
      : null,
    db.paymentConfig.findUnique({ where: { id: 1 } }),
  ]);

  const pricing = quote.pricingSnapshot as unknown as PricingResult;

  return renderToBuffer(
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
      paymentTerms={quote.paymentTerms}
      paymentConfig={paymentConfig}
    />
  ) as Promise<Buffer>;
}
