-- CreateTable: CompanyProfile singleton
CREATE TABLE "CompanyProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so the FK migration can reference it
INSERT INTO "CompanyProfile" ("id", "phone", "mobile", "email", "address")
VALUES (1, '(02) 7000-8985', '0917-132-9915', 'joleo.transport@gmail.com', 'GSIS Hills, Talipapa, Caloocan');
