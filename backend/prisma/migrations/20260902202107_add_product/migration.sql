-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('development', 'writing', 'design', 'productivity', 'education', 'business', 'marketing', 'finance', 'research', 'analytics', 'communication', 'automation', 'imageGeneration', 'videoGeneration', 'audio', 'translation', 'socialMedia', 'sales', 'legal', 'cybersecurity', 'dataScience', 'lifestyle');

-- CreateEnum
CREATE TYPE "ProductCurrency" AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'UAH');

-- CreateEnum
CREATE TYPE "ProductBillingPeriod" AS ENUM ('week', 'month', 'year');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "categories" "ProductCategory"[],
    "features" TEXT[],
    "price" DECIMAL(65,30) NOT NULL,
    "currency" "ProductCurrency" NOT NULL,
    "billingPeriod" "ProductBillingPeriod" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
