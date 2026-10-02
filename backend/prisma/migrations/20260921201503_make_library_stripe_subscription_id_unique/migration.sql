/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `UserLibrary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_stripeSubscriptionId_key" ON "UserLibrary"("stripeSubscriptionId");
