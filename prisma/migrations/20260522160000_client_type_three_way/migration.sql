-- Three-way client type: INDIVIDUAL_PERSON, INDIVIDUAL_BUSINESS, CORPORATION_BUSINESS.
-- Existing INDIVIDUAL rows are mapped to INDIVIDUAL_BUSINESS (Vyela's imported clients
-- are recurring business customers, not one-off house-mover persons).

CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL_PERSON', 'INDIVIDUAL_BUSINESS', 'CORPORATION_BUSINESS');

ALTER TABLE "Client" ADD COLUMN "type" "ClientType";

UPDATE "Client" SET "type" =
  CASE
    WHEN "businessType" = 'CORPORATION' THEN 'CORPORATION_BUSINESS'::"ClientType"
    ELSE 'INDIVIDUAL_BUSINESS'::"ClientType"
  END;

ALTER TABLE "Client" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "type" SET DEFAULT 'INDIVIDUAL_BUSINESS';

ALTER TABLE "Client" DROP COLUMN "businessType";
DROP TYPE "ClientBusinessType";

ALTER TABLE "Client" RENAME COLUMN "companyName" TO "clientName";
