-- AlterTable
ALTER TABLE "services" ADD COLUMN     "includedItems" JSONB DEFAULT '[]',
ADD COLUMN     "notIncludedItems" JSONB DEFAULT '[]';
