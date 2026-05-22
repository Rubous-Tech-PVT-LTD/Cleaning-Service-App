import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketplace_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.category.updateMany({
    where: { slug: 'labour' },
    data: { iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445175/labour_qxjaxk.png' }
  });
  console.log('Labour category icon updated!');
}
main().finally(() => prisma.$disconnect());
