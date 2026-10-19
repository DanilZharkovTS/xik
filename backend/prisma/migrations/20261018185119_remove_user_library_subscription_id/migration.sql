/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `UserLibrary` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserLibrary_subscriptionId_key";

-- AlterTable
ALTER TABLE "UserLibrary" DROP COLUMN "subscriptionId";
