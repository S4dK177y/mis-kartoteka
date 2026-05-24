const prisma = require('./prisma');

const logAction = async (userId, action, entity, entityId, details) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

module.exports = { logAction };
