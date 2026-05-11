const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.booking.updateMany({
    data: { status: 'COMPLETED' }
  });
  console.log(`Updated ${updated.count} bookings to COMPLETED`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
