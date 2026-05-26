-- Rename RateSettings.condoHandlingFee -> difficultAccessFee
ALTER TABLE "RateSettings" RENAME COLUMN "condoHandlingFee" TO "difficultAccessFee";

-- Rename Quote.condoService -> difficultAccess
ALTER TABLE "Quote" RENAME COLUMN "condoService" TO "difficultAccess";
