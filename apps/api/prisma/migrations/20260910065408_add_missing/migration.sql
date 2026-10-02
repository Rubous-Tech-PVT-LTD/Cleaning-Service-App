/*
  Warnings:

  - A unique constraint covering the columns `[providerAssignmentId]` on the table `chats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[offlineId,chatId]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_bookingId_fkey";

-- DropIndex
DROP INDEX "chats_bookingId_key";

-- DropIndex
DROP INDEX "messages_offlineId_key";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "serviceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "providerAssignmentId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "provider_assignments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "assignedItems" JSONB NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "otp" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "offlineId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_assignments_offlineId_key" ON "provider_assignments"("offlineId");

-- CreateIndex
CREATE INDEX "provider_assignments_bookingId_idx" ON "provider_assignments"("bookingId");

-- CreateIndex
CREATE INDEX "provider_assignments_providerId_idx" ON "provider_assignments"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "chats_providerAssignmentId_key" ON "chats"("providerAssignmentId");

-- CreateIndex
CREATE INDEX "chats_providerAssignmentId_idx" ON "chats"("providerAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_offlineId_chatId_key" ON "messages"("offlineId", "chatId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_assignments" ADD CONSTRAINT "provider_assignments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_assignments" ADD CONSTRAINT "provider_assignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_providerAssignmentId_fkey" FOREIGN KEY ("providerAssignmentId") REFERENCES "provider_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
