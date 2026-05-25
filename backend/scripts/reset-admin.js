const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  try {
    const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (users.length === 0) {
      console.error("ОШИБКА: Администраторы не найдены.");
      process.exit(1);
    }
    
    // Сбрасываем пароль для первого найденного администратора (обычно он один)
    const admin = users[0];
    const newPassword = 'admin';
    const hash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hash }
    });
    
    console.log(`УСПЕХ: Пароль для логина "${admin.username}" успешно сброшен на '${newPassword}'`);
  } catch (err) {
    console.error("ОШИБКА:", err.message);
    process.exit(1);
  }
}

reset().finally(() => prisma.$disconnect());
