-- Продукти й агенти стають одним типом Product (kind), ціна показується за прапорцем,
-- видалення це архівування, а звʼязок зі Stripe 1 до 1.

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('product', 'agent');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('production', 'active', 'beta', 'build');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "architecture" JSONB,
ADD COLUMN     "capabilities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "categoryLabel" TEXT,
ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "highlights" TEXT[],
ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'product',
ADD COLUMN     "protocols" TEXT[],
ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "tagline" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripeProductId_key" ON "Product"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripePriceId_key" ON "Product"("stripePriceId");

-- CreateIndex
CREATE INDEX "Product_kind_archivedAt_sortOrder_idx" ON "Product"("kind", "archivedAt", "sortOrder");
