-- DropIndex
DROP INDEX "ActionToken_userId_type_key";

-- CreateIndex
CREATE INDEX "ActionToken_userId_idx" ON "ActionToken"("userId");
