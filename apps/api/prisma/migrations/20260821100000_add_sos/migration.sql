-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SosRole" AS ENUM ('CLIENT', 'PROVIDER');

-- CreateTable
CREATE TABLE "sos" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "raisedByRole" "SosRole" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "SosStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "sos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sos_bookingId_idx" ON "sos"("bookingId");

-- CreateIndex
CREATE INDEX "sos_raisedByUserId_idx" ON "sos"("raisedByUserId");

-- CreateIndex
CREATE INDEX "sos_status_idx" ON "sos"("status");

-- CreateIndex
CREATE INDEX "sos_createdAt_idx" ON "sos"("createdAt");

-- AddForeignKey
ALTER TABLE "sos" ADD CONSTRAINT "sos_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos" ADD CONSTRAINT "sos_raisedByUserId_fkey" FOREIGN KEY ("raisedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
