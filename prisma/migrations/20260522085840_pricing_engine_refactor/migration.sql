-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('ACTIVE', 'UNDER_REPAIR', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'QUOTED', 'CONFIRMED', 'DISPATCHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VatOption" AS ENUM ('VAT_INCLUSIVE', 'VAT_EXCLUSIVE', 'NON_VAT');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('LIPAT_BAHAY', 'COMMERCIAL_DELIVERY', 'CATERING_DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('EIGHT_HOUR', 'PER_TRIP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sizeFt" INTEGER NOT NULL,
    "wheelType" TEXT NOT NULL,
    "eightHourBaseRate" DECIMAL(12,2) NOT NULL,
    "perTripBaseRate" DECIMAL(12,2) NOT NULL,
    "dailyRate" DECIMAL(12,2) NOT NULL,
    "excessHourRate" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "TruckType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plateNo" TEXT NOT NULL,
    "truckTypeId" TEXT NOT NULL,
    "status" "TruckStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dailyRate" DECIMAL(12,2) NOT NULL,
    "otRate" DECIMAL(12,2) NOT NULL,
    "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Helper" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dailyRate" DECIMAL(12,2) NOT NULL,
    "otRate" DECIMAL(12,2) NOT NULL,
    "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sampleDest" TEXT,
    "distanceMinKm" INTEGER NOT NULL,
    "distanceMaxKm" INTEGER NOT NULL,
    "surcharge" DECIMAL(12,2) NOT NULL,
    "estimatedToll" DECIMAL(12,2) NOT NULL,
    "isLongDistance" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "RouteArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "driverRate" DECIMAL(5,4) NOT NULL,
    "helperRate" DECIMAL(5,4) NOT NULL,
    "overheadRate" DECIMAL(5,4) NOT NULL,
    "longDistanceRate" DECIMAL(5,4) NOT NULL,
    "longDistanceThresholdKm" INTEGER NOT NULL,
    "dieselPricePerLiter" DECIMAL(8,2) NOT NULL,
    "fuelFloor" DECIMAL(12,2) NOT NULL,
    "fuelEfficiencyKmpl" DECIMAL(5,2) NOT NULL,
    "additionalHelperRate" DECIMAL(12,2) NOT NULL,
    "additionalHourRate" DECIMAL(12,2) NOT NULL,
    "additionalDropoffCharge" DECIMAL(12,2) NOT NULL,
    "standardIncludedHours" INTEGER NOT NULL,
    "condoHandlingFee" DECIMAL(12,2) NOT NULL,
    "cateringHandlingFee" DECIMAL(12,2) NOT NULL,
    "loadingUnloadingFee" DECIMAL(12,2) NOT NULL,
    "distanceRatePerKm" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "RateSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,
    "walkInName" TEXT,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'LIPAT_BAHAY',
    "pickupPoint" TEXT NOT NULL,
    "dropoffPoint" TEXT NOT NULL,
    "routeAreaId" TEXT,
    "estimatedDistanceKm" INTEGER NOT NULL,
    "estimatedHours" INTEGER,
    "numberOfDropoffs" INTEGER NOT NULL DEFAULT 1,
    "truckTypeId" TEXT,
    "numberOfHelpers" INTEGER NOT NULL DEFAULT 1,
    "tripBillingType" "BillingType" NOT NULL DEFAULT 'EIGHT_HOUR',
    "condoService" BOOLEAN NOT NULL DEFAULT false,
    "cateringService" BOOLEAN NOT NULL DEFAULT false,
    "additionalHelper" BOOLEAN NOT NULL DEFAULT false,
    "tollFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fuelPriceOverride" DECIMAL(8,2),
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatOption" "VatOption" NOT NULL DEFAULT 'VAT_INCLUSIVE',
    "pricingSnapshot" JSONB NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "manualOverridePrice" DECIMAL(12,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNo" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "quoteId" TEXT,
    "clientId" TEXT,
    "walkInName" TEXT,
    "scheduledDate" DATE NOT NULL,
    "scheduledStartTime" TEXT,
    "scheduledEndTime" TEXT,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "pickupPoint" TEXT NOT NULL,
    "dropoffPoint" TEXT NOT NULL,
    "estimatedDistanceKm" INTEGER NOT NULL,
    "routeAreaId" TEXT,
    "tripBillingType" "BillingType" NOT NULL DEFAULT 'EIGHT_HOUR',
    "truckId" TEXT,
    "driverId" TEXT,
    "quotedAmount" DECIMAL(12,2) NOT NULL,
    "finalAmount" DECIMAL(12,2),
    "notes" TEXT,
    "cancelReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHelper" (
    "bookingId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,

    CONSTRAINT "BookingHelper_pkey" PRIMARY KEY ("bookingId","helperId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TruckType_code_key" ON "TruckType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_code_key" ON "Truck"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plateNo_key" ON "Truck"("plateNo");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_employeeId_key" ON "Driver"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Helper_employeeId_key" ON "Helper"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteArea_code_key" ON "RouteArea"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNo_key" ON "Quote"("quoteNo");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNo_key" ON "Booking"("bookingNo");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_truckId_scheduledDate_idx" ON "Booking"("truckId", "scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckTypeId_fkey" FOREIGN KEY ("truckTypeId") REFERENCES "TruckType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHelper" ADD CONSTRAINT "BookingHelper_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHelper" ADD CONSTRAINT "BookingHelper_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
