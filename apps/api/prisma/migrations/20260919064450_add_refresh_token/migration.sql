/*
  Warnings:

  - You are about to drop the column `providerAssignmentId` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the `provider_assignments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `chats` will be added. If there are existing duplicate values, this will fail.
  - Made the column `serviceId` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bookingId` on table `chats` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_providerAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "provider_assignments" DROP CONSTRAINT "provider_assignments_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "provider_assignments" DROP CONSTRAINT "provider_assignments_providerId_fkey";

-- DropIndex
DROP INDEX "chats_providerAssignmentId_idx";

-- DropIndex
DROP INDEX "chats_providerAssignmentId_key";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "serviceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "providerAssignmentId",
ALTER COLUMN "bookingId" SET NOT NULL;

-- DropTable
DROP TABLE "provider_assignments";

-- DropEnum
DROP TYPE "AssignmentStatus";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replacedBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "chats_bookingId_key" ON "chats"("bookingId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
