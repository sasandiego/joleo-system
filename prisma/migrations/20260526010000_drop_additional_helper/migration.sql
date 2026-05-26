-- Drop unused additional-helper fields. Replaced by per-helper helperRate scaling
-- (markup = helperRate × numberOfHelpers). Quotes were wiped pre-rename so no data loss.
ALTER TABLE "RateSettings" DROP COLUMN "additionalHelperRate";
ALTER TABLE "Quote" DROP COLUMN "additionalHelper";
