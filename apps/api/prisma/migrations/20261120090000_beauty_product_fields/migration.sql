-- Clothing fields become beauty and pharmacy fields.
ALTER TABLE "Product" DROP COLUMN "fit";
ALTER TABLE "Product" RENAME COLUMN "fabric" TO "ingredients";
ALTER TABLE "Product" RENAME COLUMN "careInfo" TO "howToUse";
ALTER TABLE "Product" ADD COLUMN "warnings" TEXT;

DROP TYPE "Fit";
