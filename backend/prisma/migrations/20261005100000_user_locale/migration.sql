-- Мова інтерфейсу й листів користувача (en, es, uk).
CREATE TYPE "UserLocale" AS ENUM ('en', 'es', 'uk');
ALTER TABLE "User" ADD COLUMN "locale" "UserLocale" NOT NULL DEFAULT 'en';
