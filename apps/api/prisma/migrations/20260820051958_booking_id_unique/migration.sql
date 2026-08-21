/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `chats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chats_bookingId_key" ON "chats"("bookingId");

-- CreateIndex
CREATE INDEX "chats_providerId_idx" ON "chats"("providerId");

-- CreateIndex
CREATE INDEX "chats_clientId_idx" ON "chats"("clientId");

-- CreateIndex
CREATE INDEX "chats_updatedAt_idx" ON "chats"("updatedAt");

-- CreateIndex
CREATE INDEX "messages_chatId_idx" ON "messages"("chatId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_updatedAt_idx" ON "messages"("updatedAt");
