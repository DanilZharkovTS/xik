/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `UserLibrary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `UserLibrary` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserLibrary_stripeSubscriptionId_subscriptionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_stripeSubscriptionId_key" ON "UserLibrary"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_subscriptionId_key" ON "UserLibrary"("subscriptionId");
