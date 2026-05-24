import { db } from "@/lib/db";
import { auth } from "@/features/auth/config";
import { generateQuotePdf } from "@/lib/generate-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const quote = await db.quote.findUnique({ where: { id }, select: { quoteNo: true } });
  if (!quote) return new Response("Not found", { status: 404 });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateQuotePdf(id);
  } catch (err) {
    console.error("[PDF] generateQuotePdf failed:", err);
    return new Response(`PDF generation failed: ${String(err)}`, { status: 500 });
  }

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNo}.pdf"`,
    },
  });
}
