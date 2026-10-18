/*
  Warnings:

  - You are about to drop the column `licenseKey` on the `UserLibrary` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserLibrary_licenseKey_key";

-- AlterTable
ALTER TABLE "UserLibrary" DROP COLUMN "licenseKey";
