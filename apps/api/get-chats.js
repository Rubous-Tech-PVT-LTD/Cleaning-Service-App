const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const chats = await prisma.chat.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        booking: {
          include: { service: true }
        }
      }
    });
    console.log('--- RECENT CHATS ---');
    chats.forEach(c => {
      console.log(`Chat ID: ${c.id}`);
      console.log(`Service: ${c.booking?.service?.nameTranslations?.en || 'Service'}`);
      console.log(`Participants: Client(${c.clientId}) | Provider(${c.providerId})`);
      console.log('--------------------');
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
