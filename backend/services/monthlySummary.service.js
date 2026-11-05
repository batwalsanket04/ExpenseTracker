const { User, NotificationPreference, Expense, Credit, BudgetPreference } = require("../models");
const { createNotification } = require("../controllers/notification.controller");
const { sendEmail } = require("../services/emailService");
const { logger, serializeError } = require("../config/logger");
const { Op } = require("sequelize");
const {
  startOfMonth,
  endOfMonth,
  resolveNotificationPrefs,
} = require("./cronHelpers");

const MODULE = "monthlySummary";

const sumAmounts = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

const daysInMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

/**
 * Generate and deliver monthly summary reports to users who have Monthly
 * Summary enabled.
 *
 * Calculates monthly income, monthly expenses, savings, budget utilization,
 * highest spending categories and average daily spending.
 *
 * @returns {Promise<{processed: number, sent: number, skipped: number,
 *   errors: number, results: Array}>}
 */
const sendMonthlySummaries = async () => {
  const startedAt = new Date();
  logger.info(`${MODULE}: starting`, { startedAt });

  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

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
    if (prefsResolved.monthlySummary !== true) {
      skipped += 1;
      results.push({ userId, status: "skipped", reason: "summary_disabled" });
      continue;
    }

    try {
      const emailEnabled = prefsResolved.emailNotifications === true;
      const inAppEnabled = prefsResolved.inAppNotifications !== false;

      // Monthly income (credits)
      const credits = await Credit.findAll({
        where: {
          userId,
          date: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
        },
        attributes: ["amount"],
      });
      const monthlyIncome = sumAmounts(credits);

      // Monthly expenses
      const expenses = await Expense.findAll({
        where: {
          userId,
          date: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
        },
        attributes: ["amount", "category", "date"],
      });
      const monthlyExpenses = sumAmounts(expenses);

      // Category-wise spending
      const categoryMap = {};
      for (const e of expenses) {
        const cat = e.category || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
      }
      const categorySpending = Object.entries(categoryMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const highestSpendingCategories = categorySpending
        .slice(0, 3)
        .map((entry) => entry.category);

      // Budget utilization from the user's monthly budget preference.
      let monthlyBudget = 0;
      let budgetUtilization = 0;
      let remainingBudget = 0;
      const budgetPref = budgetPrefMap[userId];
      if (budgetPref) {
        monthlyBudget = Number(budgetPref.monthlyBudget || 0);
        budgetUtilization =
          monthlyBudget > 0
            ? Math.round((monthlyExpenses / monthlyBudget) * 100)
            : 0;
        remainingBudget = Math.max(0, monthlyBudget - monthlyExpenses);
      }

      const savings = monthlyIncome - monthlyExpenses;
      const totalDays = daysInMonth(monthStart);
      const averageDailySpending =
        totalDays > 0 ? Math.round((monthlyExpenses / totalDays) * 100) / 100 : 0;

      const summary = {
        period: "monthly",
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        monthlyIncome,
        monthlyExpenses,
        savings,
        budgetUtilization,
        remainingBudget,
        highestSpendingCategories,
        categorySpending,
        averageDailySpending,
        totalDays,
      };

      const monthLabel = monthStart.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const title = `Monthly Summary (${monthLabel})`;
      const message = `Hi ${user.name},\n\nYour monthly summary:\n- Total Income: ₹${monthlyIncome}\n- Total Expenses: ₹${monthlyExpenses}\n- Savings: ₹${savings}\n- Budget Utilization: ${budgetUtilization}%\n- Remaining Budget: ₹${remainingBudget}\n- Highest Spending Categories: ${highestSpendingCategories.join(", ") || "None"}\n- Average Daily Spending: ₹${averageDailySpending}\n\nKeep tracking!\n— ExpenseTracker`;

      // In-app notification.
      if (inAppEnabled) {
        await createNotification({
          userId,
          type: "monthly_summary",
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

module.exports = { sendMonthlySummaries };
