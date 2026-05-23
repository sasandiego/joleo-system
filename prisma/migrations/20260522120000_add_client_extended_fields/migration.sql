-- CreateEnum
CREATE TYPE "ClientBusinessType" AS ENUM ('CORPORATION', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessType" "ClientBusinessType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "clientCode" TEXT,
ADD COLUMN     "landline" TEXT,
ADD COLUMN     "tin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientCode_key" ON "Client"("clientCode");
