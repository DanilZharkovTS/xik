/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId,subscriptionId]` on the table `UserLibrary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserLibrary_stripeSubscriptionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_stripeSubscriptionId_subscriptionId_key" ON "UserLibrary"("stripeSubscriptionId", "subscriptionId");
