-- AlterTable
ALTER TABLE "services" ADD COLUMN     "subcategoryId" TEXT;

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameTranslations" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subcategories_categoryId_idx" ON "subcategories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_slug_key" ON "subcategories"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- CreateIndex
CREATE INDEX "services_subcategoryId_idx" ON "services"("subcategoryId");

-- CreateIndex
CREATE INDEX "services_categoryId_subcategoryId_idx" ON "services"("categoryId", "subcategoryId");

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
