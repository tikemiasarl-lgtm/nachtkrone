-- Changes already present in the database, recorded for migration history.
ALTER TYPE "ProductCategory" ADD VALUE 'MASK_AND_COSTUME';
ALTER TABLE "Product" ADD COLUMN "promotionalPrice" DECIMAL(10,2);
