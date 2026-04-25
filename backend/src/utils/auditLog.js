import AuditLog from '../models/AuditLog.model.js';

export async function createAuditLog({ userId, action, resource, resourceId, details, req }) {
  await AuditLog.create({
    user: userId,
    action,
    resource,
    resourceId,
    details,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get?.('User-Agent'),
  });
}
