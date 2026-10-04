CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");
