const prisma = require('../utils/prisma');

beforeAll(async () => {
  // Ensure we can connect to the database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
