const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.consultation.updateMany({
    where: { type: 'REGULAR' },
    data: { type: 'PRIMARY' }
  });
  console.log(`Migrated ${count.count} consultations from REGULAR to PRIMARY`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
