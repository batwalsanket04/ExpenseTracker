const { User, NotificationPreference, Expense, Credit, BudgetPreference } = require("../models");
const { createNotification } = require("../controllers/notification.controller");
const { sendEmail } = require("../services/emailService");
const { logger, serializeError } = require("../config/logger");
const { Op } = require("sequelize");
const {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  resolveNotificationPrefs,
} = require("./cronHelpers");

const MODULE = "weeklySummary";

const sumAmounts = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

/**
 * Generate and deliver weekly summaries to users who have Weekly Summary
 * enabled.
 *
 * Calculates total weekly income, total weekly expenses, category-wise
 * spending, highest spending category, remaining budget and weekly savings.
 *
 * @returns {Promise<{processed: number, sent: number, skipped: number,
 *   errors: number, results: Array}>}
 */
const sendWeeklySummaries = async () => {
  const startedAt = new Date();
  logger.info(`${MODULE}: starting`, { startedAt });

  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();
  const monthStart = startOfMonth(); // reference month for remaining budget

  const users = await User.findAll({
    attributes: ["id", "name", "email"],
    order: [["createdAt", "ASC"]],
  });

  const prefs = await NotificationPreference.findAll();
  const prefMap = {};
  for (const pref of prefs) prefMap[pref.userId] = pref.get({ plain: true });

  const budgetPrefs = await BudgetPreference.findAll();
  const budgetPrefMap = {};
  for (const bp of budgetPrefs) budgetPrefMap[bp.userId] = bp.get({ plain: true });

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const results = [];

  for (const user of users) {
    processed += 1;
    const userId = user.id;

    const prefsResolved = resolveNotificationPrefs(userId, prefMap);
    if (prefsResolved.weeklySummary !== true) {
      skipped += 1;
      results.push({ userId, status: "skipped", reason: "summary_disabled" });
      continue;
    }

    try {
      const emailEnabled = prefsResolved.emailNotifications === true;
      const inAppEnabled = prefsResolved.inAppNotifications !== false;

      // Weekly income (credits)
      const credits = await Credit.findAll({
        where: {
          userId,
          date: { [Op.gte]: weekStart, [Op.lte]: weekEnd },
        },
        attributes: ["amount"],
      });
      const totalIncome = sumAmounts(credits);

      // Weekly expenses
      const expenses = await Expense.findAll({
        where: {
          userId,
          date: { [Op.gte]: weekStart, [Op.lte]: weekEnd },
        },
        attributes: ["amount", "category"],
      });
      const totalExpenses = sumAmounts(expenses);

      // Category-wise spending
      const categoryMap = {};
      for (const e of expenses) {
        const cat = e.category || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
      }
      const categorySpending = Object.entries(categoryMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const highestSpendingCategory = categorySpending.length
        ? categorySpending[0].category
        : null;

      // Remaining budget from the user's monthly budget preference.
      let remainingBudget = null;
      let budgetUtilization = null;
      const budgetPref = budgetPrefMap[userId];
      if (budgetPref) {
        const monthlyBudget = Number(budgetPref.monthlyBudget || 0);
        remainingBudget = Math.max(0, monthlyBudget - totalExpenses);
        budgetUtilization =
          monthlyBudget > 0
            ? Math.round((totalExpenses / monthlyBudget) * 100)
            : 0;
      }

      const weeklySavings = totalIncome - totalExpenses;

      const summary = {
        period: "weekly",
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalIncome,
        totalExpenses,
        categorySpending,
        highestSpendingCategory,
        remainingBudget,
        budgetUtilization,
        weeklySavings,
      };

      const title = `Weekly Summary (${weekStart.toDateString()} - ${weekEnd.toDateString()})`;
      const message = `Hi ${user.name},\n\nYour weekly summary:\n- Total Income: ₹${totalIncome}\n- Total Expenses: ₹${totalExpenses}\n- Weekly Savings: ₹${weeklySavings}\n- Highest Spending Category: ${highestSpendingCategory || "None"}\n- Remaining Budget: ₹${remainingBudget}\n\nKeep tracking!\n— ExpenseTracker`;

      // In-app notification.
      if (inAppEnabled) {
        await createNotification({
          userId,
          type: "weekly_summary",
          title,
          message,
          data: { ...summary, channel: "in_app" },
        });
      }

      // Email (only when email notifications are enabled).
      let emailResult = { sent: false, reason: "email_not_enabled" };
      if (emailEnabled && user.email) {
        emailResult = await sendEmail({
          to: user.email,
          subject: title,
          text: message,
        });
      }

      sent += 1;
      logger.info(`${MODULE}: summary sent`, { userId, ...summary });
      results.push({ userId, status: "sent", summary, email: emailResult });
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
    sent,
    skipped,
    errors,
  });

  return { processed, sent, skipped, errors, results };
};

module.exports = { sendWeeklySummaries };
