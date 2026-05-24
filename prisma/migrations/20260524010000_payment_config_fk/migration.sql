-- Add companyProfileId to PaymentConfig (nullable first so existing rows don't fail)
ALTER TABLE "PaymentConfig" ADD COLUMN "companyProfileId" INTEGER;

-- Backfill existing singleton row
UPDATE "PaymentConfig" SET "companyProfileId" = 1;

-- Make NOT NULL
ALTER TABLE "PaymentConfig" ALTER COLUMN "companyProfileId" SET NOT NULL;

-- Add UNIQUE constraint
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_companyProfileId_key" UNIQUE ("companyProfileId");

-- Add FK constraint
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_companyProfileId_fkey"
    FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
