-- CreateEnum
CREATE TYPE "OutreachTemplateStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "OutreachEvent" ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "templateVersion" INTEGER;

-- CreateTable
CREATE TABLE "OutreachTemplate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "OutreachTemplateStatus" NOT NULL DEFAULT 'active',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachTemplate_productId_status_channel_idx" ON "OutreachTemplate"("productId", "status", "channel");

-- CreateIndex
CREATE INDEX "OutreachTemplate_ownerUserId_idx" ON "OutreachTemplate"("ownerUserId");

-- CreateIndex
CREATE INDEX "OutreachEvent_templateId_idx" ON "OutreachEvent"("templateId");

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OutreachTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTemplate" ADD CONSTRAINT "OutreachTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTemplate" ADD CONSTRAINT "OutreachTemplate_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Шаблон і його версія завжди йдуть парою.
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_template_pair_check"
CHECK (("templateId" IS NULL) = ("templateVersion" IS NULL));
