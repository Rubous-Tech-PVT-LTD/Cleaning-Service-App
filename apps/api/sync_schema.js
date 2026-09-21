const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketplace_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    console.log('--- Applying non-destructive ALTER TABLE additions ---');
    
    // 1. Create DurationType enum if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DurationType') THEN
          CREATE TYPE "DurationType" AS ENUM ('FLEXIBLE', 'FIXED');
        END IF;
      END$$;
    `);
    console.log('Checked/created DurationType enum.');

    // 2. Add isComingSoon and durationType to services table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services" 
      ADD COLUMN IF NOT EXISTS "isComingSoon" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('Added isComingSoon column to services.');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services" 
      ADD COLUMN IF NOT EXISTS "durationType" "DurationType" NOT NULL DEFAULT 'FLEXIBLE';
    `);
    console.log('Added durationType column to services.');

    // 3. Add indices
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "services_isComingSoon_idx" ON "services"("isComingSoon");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "services_isTrending_idx" ON "services"("isTrending");
    `);
    console.log('Indices created successfully.');

    // Verify
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'services'
      ORDER BY ordinal_position;
    `);
    console.log('Updated services table columns:');
    console.table(cols);

    // Verify finding services
    const services = await prisma.service.findMany({
      include: {
        category: true,
        subcategory: true,
      }
    });
    console.log(`Successfully fetched ${services.length} services with Prisma!`);

    const count = await prisma.service.count();
    console.log(`Total services in DB: ${count}`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
