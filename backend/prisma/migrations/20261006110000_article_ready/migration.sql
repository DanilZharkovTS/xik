-- Переклад показується на сайті, лише коли він завершений (є заголовок, анонс і хоча б один блок).
ALTER TABLE "ArticleTranslation" ADD COLUMN "isReady" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "ArticleTranslation_locale_isReady_idx" ON "ArticleTranslation"("locale", "isReady");
