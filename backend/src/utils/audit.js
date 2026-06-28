const prisma = require("../lib/prisma");
const logger = require("./logger");

async function createAuditLog({ userId, action, entity, entityId }) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId || null, action, entity, entityId: entityId || null },
    });
  } catch (err) {
    // Never let audit failure crash the request
    logger.warn({ err: err.message, action, entity, entityId }, "Audit log write failed");
  }
}

module.exports = { createAuditLog };