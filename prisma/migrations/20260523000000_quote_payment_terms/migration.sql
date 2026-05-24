-- Remove paymentTerms from Client (moving to Quote)
ALTER TABLE "Client" DROP COLUMN IF EXISTS "paymentTerms";

-- Add paymentTerms to Quote
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
