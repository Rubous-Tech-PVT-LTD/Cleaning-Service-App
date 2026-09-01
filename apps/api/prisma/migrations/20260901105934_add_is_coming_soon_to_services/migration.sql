-- AlterTable
ALTER TABLE "services" ADD COLUMN     "isComingSoon" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "services_isComingSoon_idx" ON "services"("isComingSoon");
