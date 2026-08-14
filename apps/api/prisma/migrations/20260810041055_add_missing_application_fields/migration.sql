
  -- A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.


-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "otp" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "country" TEXT,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "professionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email")