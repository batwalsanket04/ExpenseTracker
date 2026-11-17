const { Audit } = require("../models");
const { logger, serializeError } = require("../config/logger");

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
 * Audit-logging is "best effort": failures are logged but never break the
 * actual request. Returns true when the audit row was written, false otherwise.
 *
 * @param {Object} params
 * @param {string|undefined} params.userId - id of the user performing the action
 * @param {string} params.action - e.g. "LOGIN", "EXPENSE_CREATE", "USER_DELETE"
 * @param {string} params.module - e.g. "auth", "expense", "user", "audit"
 * @param {string} [params.details] - extra context
 * @param {Object} [params.req] - express request (used to capture IP)
 * @param {any} [params.previousValue] - value before the change (will be JSON-stringified)
 * @param {any} [params.newValue] - value after the change (will be JSON-stringified)
 * @returns {Promise<boolean>}
 */
const auditLogger = async ({
  userId,
  action,
  module,
  details,
  req,
  previousValue,
  newValue,
} = {}) => {
  try {
    await Audit.create({
      userId: userId || null,
      action,
      module,
      details: details || null,
      previousValue: previousValue !== undefined ? JSON.stringify(previousValue) : null,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
      ip: req ? (req.ip || req.socket.remoteAddress || null) : null,
    });
    return true;
  } catch (error) {
    // Log at error level with full stack so audit-logging failures are
    // visible and debuggable, but never let them break the actual request.
    logger.error("Audit log write failed", {
      action,
      module,
      userId,
      error: serializeError(error),
    });
    return false;
  }
};

module.exports = { auditLogger };
