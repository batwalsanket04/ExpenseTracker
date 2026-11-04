const { Audit } = require("../models");

/**
 * Audit log helper. Records an audit event to the audit_logs table.
 *
 * Usage (inside a controller/route handler):
 *   await auditLogger({
 *     userId: req.user?.id,
 *     action: "LOGIN",
 *     module: "auth",
 *     details: "User logged in",
 *     req,
 *   });
 *
 * @param {Object} params
 * @param {string|undefined} params.userId - id of the user performing the action
 * @param {string} params.action - e.g. "LOGIN", "EXPENSE_CREATE", "USER_DELETE"
 * @param {string} params.module - e.g. "auth", "expense", "user", "audit"
 * @param {string} [params.details] - extra context
 * @param {Object} [params.req] - express request (used to capture IP)
 */
const auditLogger = async ({ userId, action, module, details, req } = {}) => {
  try {
    await Audit.create({
      userId: userId || null,
      action,
      module,
      details: details || null,
      ip: req ? (req.ip || req.socket.remoteAddress || null) : null,
    });
  } catch (error) {
    // Never let audit-logging failure break the actual request.
    const { logger } = require("../config/logger");
    logger.warn("Audit log write failed", {
      action,
      module,
      error: error.message,
    });
  }
};

module.exports = { auditLogger };
