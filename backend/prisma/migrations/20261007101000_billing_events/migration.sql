CREATE TABLE "BillingEvent" (
  "id" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notification" JSONB,
  "notificationSentAt" TIMESTAMP(3),
  CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);
