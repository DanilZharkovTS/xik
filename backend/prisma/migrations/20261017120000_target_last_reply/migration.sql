-- AlterTable
ALTER TABLE "OutreachTarget" ADD COLUMN "lastReplyAt" TIMESTAMP(3);

-- Backfill: остання відповідь з уже записаних подій.
UPDATE "OutreachTarget" t
SET "lastReplyAt" = r."lastReplyAt"
FROM (
  SELECT "targetId", MAX("occurredAt") AS "lastReplyAt"
  FROM "OutreachEvent"
  WHERE "type" = 'reply' AND "targetId" IS NOT NULL
  GROUP BY "targetId"
) r
WHERE r."targetId" = t."id";

-- CreateIndex
CREATE INDEX "OutreachTarget_productId_ownerUserId_status_idx" ON "OutreachTarget"("productId", "ownerUserId", "status");
