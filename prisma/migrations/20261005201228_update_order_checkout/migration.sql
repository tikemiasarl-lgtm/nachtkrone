/*
  Warnings:

  - You are about to drop the column `receiptNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[confirmationDocumentNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shippingCountryCode` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Order_receiptNumber_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "receiptNumber",
DROP COLUMN "receiptUrl",
ADD COLUMN     "adminNotificationEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminNotificationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingAddress2" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingCountryCode" TEXT,
ADD COLUMN     "billingFirstName" TEXT,
ADD COLUMN     "billingLastName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "confirmationDocumentNumber" TEXT,
ADD COLUMN     "confirmationDocumentUrl" TEXT,
ADD COLUMN     "hasDifferentBillingAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingCountryCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_confirmationDocumentNumber_key" ON "Order"("confirmationDocumentNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- CreateIndex
CREATE INDEX "Order_shippingCountryCode_idx" ON "Order"("shippingCountryCode");
