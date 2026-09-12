-- CreateEnum
CREATE TYPE "DurationType" AS ENUM ('FLEXIBLE', 'FIXED');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "durationType" "DurationType" NOT NULL DEFAULT 'FLEXIBLE';
