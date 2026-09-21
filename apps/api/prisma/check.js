const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.booking.count();
  console.log('Total bookings in DB:', count);
}
main().finally(() => prisma.$disconnect());
