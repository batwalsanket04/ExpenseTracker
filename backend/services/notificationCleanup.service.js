const { Notification } = require("../models");
const { logger, serializeError } = require("../config/logger");
const { Op } = require("sequelize");
const { startOfDay, addDays } = require("./cronHelpers");

const MODULE = "notificationCleanup";

/**
 * Clean up old notifications based on the retention policy.
 *
 * - Deletes notifications older than NOTIFICATION_RETENTION_DAYS (default 30).
 * - Deletes expired expense reminder notifications older than
 *   EXPIRED_REMINDER_DAYS (default 7).
 *
 * @returns {Promise<{deletedOld: number, deletedExpiredReminders: number,
 *   errors: number}>}
 */
const cleanupNotifications = async () => {
  const startedAt = new Date();
  logger.info(`${MODULE}: starting`, { startedAt });

  const retentionDays = Number(process.env.NOTIFICATION_RETENTION_DAYS || 30);
  const expiredReminderDays = Number(process.env.EXPIRED_REMINDER_DAYS || 7);

  const retentionCutoff = addDays(startOfDay(), -retentionDays);
  const reminderCutoff = addDays(startOfDay(), -expiredReminderDays);

  let deletedOld = 0;
  let deletedExpiredReminders = 0;
  let errors = 0;

  try {
    // 1. Delete notifications older than the retention policy.
    const oldResult = await Notification.destroy({
      where: {
        createdAt: { [Op.lt]: retentionCutoff },
      },
    });
    deletedOld = oldResult;
    logger.info(`${MODULE}: deleted old notifications`, {
      count: deletedOld,
      cutoff: retentionCutoff.toISOString(),
      retentionDays,
    });

    // 2. Remove expired reminder notifications.
    const reminderResult = await Notification.destroy({
      where: {
        type: "expense_reminder",
        createdAt: { [Op.lt]: reminderCutoff },
      },
    });
    deletedExpiredReminders = reminderResult;
    logger.info(`${MODULE}: deleted expired reminders`, {
      count: deletedExpiredReminders,
      cutoff: reminderCutoff.toISOString(),
      expiredReminderDays,
    });
  } catch (error) {
    errors += 1;
    logger.error(`${MODULE}: cleanup failed`, {
      error: serializeError(error),
    });
  }

  logger.info(`${MODULE}: completed`, {
    startedAt,
    finishedAt: new Date(),
    deletedOld,
    deletedExpiredReminders,
    errors,
  });

  return { deletedOld, deletedExpiredReminders, errors };
};

module.exports = { cleanupNotifications };
