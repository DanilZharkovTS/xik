-- Переклади контенту продукту (es, uk). Англійська лишається в основних колонках.
ALTER TABLE "Product" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
