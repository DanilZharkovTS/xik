-- CreateEnum
CREATE TYPE "OutreachPublicationKind" AS ENUM ('post', 'ad', 'article', 'link_in_offer');

-- AlterEnum
ALTER TYPE "OutreachEventType" ADD VALUE 'status';

-- AlterTable
ALTER TABLE "OutreachEvent" ADD COLUMN     "publicationKind" "OutreachPublicationKind",
ADD COLUMN     "urlNormalized" TEXT;

-- Одну публікацію (за нормалізованим URL) в межах продукту записують лише раз.
CREATE UNIQUE INDEX "OutreachEvent_publication_url_key"
ON "OutreachEvent"("productId", "urlNormalized")
WHERE "type" = 'publication';

-- Публікація не прив'язана до цілі й завжди має вид і URL; решта подій без виду.
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_publication_shape_check" CHECK (
  ("type" = 'publication' AND "targetId" IS NULL AND "publicationKind" IS NOT NULL AND "urlNormalized" IS NOT NULL)
  OR ("type" <> 'publication' AND "targetId" IS NOT NULL AND "publicationKind" IS NULL AND "urlNormalized" IS NULL)
);
