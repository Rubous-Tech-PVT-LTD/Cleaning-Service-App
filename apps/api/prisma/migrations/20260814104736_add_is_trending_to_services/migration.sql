-- AlterTable
ALTER TABLE "services" ADD COLUMN     "isTrending" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "services_isTrending_idx" ON "services"("isTrending");
