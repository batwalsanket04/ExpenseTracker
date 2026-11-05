const { User, NotificationPreference, Expense } = require("../models");
const { createNotification } = require("../controllers/notification.controller");
const { sendEmail } = require("../services/emailService");
const { logger, serializeError } = require("../config/logger");
const { Op } = require("sequelize");
const {
  startOfDay,
  endOfDay,
  resolveNotificationPrefs,
} = require("./cronHelpers");

const MODULE = "expenseReminder";

/**
 * Send daily expense reminders.
 *
 * - Only users who have Expense Reminder enabled are considered (defaults to
 *   enabled for users without a persisted preference row).
 * - Users who already added an expense today are skipped.
 * - An in-app notification is created when in-app notifications are enabled.
 * - An email reminder is sent only when email notifications are enabled.
 * - Failures for one user never stop processing the remaining users.
 *
 * @returns {Promise<{processed: number, reminded: number, skipped: number,
 *   errors: number, results: Array}>}
 */
const sendExpenseReminders = async () => {
  const startedAt = new Date();
  logger.info(`${MODULE}: starting`, { startedAt });

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const users = await User.findAll({
    attributes: ["id", "name", "email"],
    order: [["createdAt", "ASC"]],
  });

  const prefs = await NotificationPreference.findAll({
    attributes: [
      "userId",
      "emailNotifications",
      "inAppNotifications",
      "expenseReminder",
    ],
  });
  const prefMap = {};
  for (const pref of prefs) prefMap[pref.userId] = pref.get({ plain: true });

  let processed = 0;
  let reminded = 0;
  let skipped = 0;
  let errors = 0;
  const results = [];

  for (const user of users) {
    processed += 1;
    const userId = user.id;

    const prefsResolved = resolveNotificationPrefs(userId, prefMap);
    if (prefsResolved.expenseReminder !== true) {
      // Reminders explicitly disabled for this user.
      skipped += 1;
      results.push({
        userId,
        status: "skipped",
        reason: "reminders_disabled",
      });
      continue;
    }

    try {
      // Check whether the user already added an expense today.
      const expenseToday = await Expense.findOne({
        where: {
          userId,
          date: {
            [Op.gte]: todayStart,
            [Op.lte]: todayEnd,
          },
        },
        attributes: ["id"],
        limit: 1,
      });

      if (expenseToday) {
        skipped += 1;
        results.push({
          userId,
          status: "skipped",
          reason: "expense_added_today",
        });
        continue;
      }

      const emailEnabled = prefsResolved.emailNotifications === true;
      const inAppEnabled = prefsResolved.inAppNotifications !== false;

      // In-app notification.
      if (inAppEnabled) {
        await createNotification({
          userId,
          type: "expense_reminder",
          title: "Expense Reminder",
          message: `Hi ${user.name}, you haven't added an expense for today (${todayStart.toDateString()}). Don't forget to log your spending!`,
          data: {
            date: todayStart.toISOString(),
            channel: "in_app",
          },
        });
      }

      // Email reminder (only when email notifications are enabled).
      let emailResult = { sent: false, reason: "email_not_enabled" };
      if (emailEnabled && user.email) {
        emailResult = await sendEmail({
          to: user.email,
          subject: "Expense Reminder - Log your spending today",
          text: `Hi ${user.name},\n\nYou haven't added an expense for today. Please log your spending to keep your budget on track.\n\n— ExpenseTracker`,
          html: `<p>Hi ${user.name},</p><p>You haven't added an expense for today. Please log your spending to keep your budget on track.</p>`,
        });
      }

      reminded += 1;
      logger.info(`${MODULE}: reminder sent`, {
        userId,
        userName: user.name,
        email: emailResult,
      });
      results.push({
        userId,
        status: "reminded",
        inApp: inAppEnabled,
        email: emailResult,
      });
    } catch (error) {
      errors += 1;
      logger.error(`${MODULE}: failed for user`, {
        userId,
        error: serializeError(error),
      });
      results.push({ userId, status: "error", error: error.message });
    }
  }

  logger.info(`${MODULE}: completed`, {
    startedAt,
    finishedAt: new Date(),
    processed,
    reminded,
    skipped,
    errors,
  });

  return { processed, reminded, skipped, errors, results };
};

module.exports = { sendExpenseReminders };
