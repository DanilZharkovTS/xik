-- CreateEnum
CREATE TYPE "OutreachTargetStatus" AS ENUM ('active', 'do_not_contact');

-- CreateEnum
CREATE TYPE "OutreachEventType" AS ENUM ('first', 'repeat', 'reply', 'publication');

-- CreateTable
CREATE TABLE "OutreachTarget" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "status" "OutreachTargetStatus" NOT NULL DEFAULT 'active',
    "statusReason" TEXT,
    "firstContactedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachIdentifier" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "valueNormalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "targetId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "OutreachEventType" NOT NULL,
    "channel" TEXT,
    "url" TEXT,
    "comment" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachTarget_ownerUserId_lastContactedAt_idx" ON "OutreachTarget"("ownerUserId", "lastContactedAt");

-- CreateIndex
CREATE INDEX "OutreachTarget_productId_lastContactedAt_idx" ON "OutreachTarget"("productId", "lastContactedAt");

-- CreateIndex
CREATE INDEX "OutreachIdentifier_targetId_idx" ON "OutreachIdentifier"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachIdentifier_productId_channel_valueNormalized_key" ON "OutreachIdentifier"("productId", "channel", "valueNormalized");

-- CreateIndex
CREATE INDEX "OutreachEvent_targetId_occurredAt_idx" ON "OutreachEvent"("targetId", "occurredAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_userId_occurredAt_idx" ON "OutreachEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_productId_type_occurredAt_idx" ON "OutreachEvent"("productId", "type", "occurredAt");

-- AddForeignKey
ALTER TABLE "OutreachTarget" ADD CONSTRAINT "OutreachTarget_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTarget" ADD CONSTRAINT "OutreachTarget_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachIdentifier" ADD CONSTRAINT "OutreachIdentifier_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "OutreachTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachIdentifier" ADD CONSTRAINT "OutreachIdentifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "OutreachTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
