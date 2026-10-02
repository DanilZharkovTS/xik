/*
  Warnings:

  - Made the column `lastUsedAt` on table `UserSession` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "UserSession" ALTER COLUMN "lastUsedAt" SET NOT NULL,
ALTER COLUMN "lastUsedAt" SET DEFAULT CURRENT_TIMESTAMP;
