/*
  Warnings:

  - A unique constraint covering the columns `[licenseKey]` on the table `UserLibrary` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserLibrary" ADD COLUMN     "licenseId" TEXT,
ADD COLUMN     "licenseKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserLibrary_licenseKey_key" ON "UserLibrary"("licenseKey");
