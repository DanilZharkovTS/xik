/*
  Warnings:

  - The `licenseId` column on the `UserLibrary` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserLibrary" DROP COLUMN "licenseId",
ADD COLUMN     "licenseId" INTEGER;
