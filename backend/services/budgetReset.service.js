const { User, Budget, BudgetPreference, Audit } = require("../models");
const { logger, serializeError } = require("../config/logger");
const { Op } = require("sequelize");
const {
  startOfDay,
  endOfDay,
  addDays,
  resolveBudgetPrefs,
  getNextPeriodDates,
} = require("./cronHelpers");

const MODULE = "budgetReset";

const ACTION = "BUDGET_RESET";

/**
 * Process budget resets for all users who have Auto Reset Budget enabled.
 *
 * A reset is due for a user when their current budget period has ended
 * (today is strictly after the latest budget end date). For each due user:
 *
 *   - Stores the closing period's budgets as history (Audit records).
 *   - Resets usage: new period budgets start with spent = 0.
 *   - Creates the next budget period (start = day after current end).
 *   - Carries forward the remaining budget when Carry Forward is enabled.
 *
 * The reset is idempotent: if next-period budgets already exist for a
 * user/category, no duplicates are created.
 *
 * @returns {Promise<{processed: number, reset: number, skipped: number,
 *   errors: number, results: Array}>}
 */
const processBudgetReset = async () => {
  const startedAt = new Date();
  logger.info(`${MODULE}: starting`, { startedAt });

  const today = startOfDay();

  const users = await User.findAll({
    attributes: ["id", "name", "email"],
    order: [["createdAt", "ASC"]],
  });

  const budgetPrefs = await BudgetPreference.findAll();
  const budgetPrefMap = {};
  for (const bp of budgetPrefs) {
    budgetPrefMap[bp.userId] = bp.get({ plain: true });
  }

  let processed = 0;
  let reset = 0;
  let skipped = 0;
  let errors = 0;
  const results = [];

  for (const user of users) {
    processed += 1;
    const userId = user.id;

    const prefs = resolveBudgetPrefs(userId, budgetPrefMap);
    if (prefs.autoResetBudget !== true) {
      skipped += 1;
      results.push({
        userId,
        status: "skipped",
        reason: "auto_reset_disabled",
      });
      continue;
    }

    try {
      // The user's budgets, newest period first.
      const budgets = await Budget.findAll({
        where: { userId },
        order: [["endDate", "DESC"], ["startDate", "DESC"], ["category", "ASC"]],
      });

      if (!budgets.length) {
        skipped += 1;
        results.push({ userId, status: "skipped", reason: "no_budgets" });
        continue;
      }

      // Identify the latest period from the budget whose end date is the
      // most recent. All budgets sharing that (startDate, endDate) belong to
      // the closing period.
      let latestBudget = budgets[0];
      for (const b of budgets) {
        if (new Date(b.endDate).getTime() > new Date(latestBudget.endDate).getTime()) {
          latestBudget = b;
        }
      }
      const latestEnd = new Date(latestBudget.endDate);
      const latestStart = new Date(latestBudget.startDate);

      // Reset due only when the current period has fully ended.
      if (today <= latestEnd) {
        skipped += 1;
        results.push({
          userId,
          status: "skipped",
          reason: "period_not_ended",
          periodEnd: latestEnd.toISOString(),
        });
        continue;
      }

      // Budgets belonging to the latest (closing) period.
      const periodBudgets = budgets.filter((b) => {
        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();
        return bStart === latestStart.getTime() && bEnd === latestEnd.getTime();
      });

      const period = prefs.budgetPeriod || "monthly";
      const { nextStart, nextEnd } = getNextPeriodDates(latestEnd, period);

      let resetCount = 0;

      for (const budget of periodBudgets) {
        const budgetPlain = budget.get({ plain: true });
        const allocated = Number(budgetPlain.amount || 0);
        const spent = Number(budgetPlain.spent || 0);
        const remaining = Math.max(0, allocated - spent);

        // --- Store budget history (Audit record) ---
        try {
          await Audit.create({
            userId,
            action: ACTION,
            module: "budget",
            details: JSON.stringify({
              category: budgetPlain.category,
              amount: allocated,
              spent,
              remaining,
              period: budgetPlain.period,
              startDate: budgetPlain.startDate,
              endDate: budgetPlain.endDate,
              carryForward: prefs.carryForwardBudget,
            }),
          });
        } catch (historyErr) {
          // Never let history storage failure block the reset itself.
          logger.warn(`${MODULE}: history storage failed`, {
            userId,
            budgetId: budgetPlain.id,
            error: historyErr.message,
          });
        }

        // --- Create next period budget ---
        // Idempotency: skip if a next-period budget already exists for this user/category.
        const existsNext = await Budget.findOne({
          where: {
            userId,
            category: budgetPlain.category,
            startDate: nextStart,
          },
          attributes: ["id"],
        });
        if (existsNext) {
          continue;
        }

        const nextAmount = prefs.carryForwardBudget
          ? allocated + remaining
          : allocated;

        await Budget.create({
          userId,
          category: budgetPlain.category,
          amount: nextAmount,
          spent: 0, // usage reset for the new period
          period,
          startDate: nextStart,
          endDate: nextEnd,
        });

        resetCount += 1;
      }

      reset += resetCount;
      logger.info(`${MODULE}: reset processed`, {
        userId,
        userName: user.name,
        period: { startDate: latestStart, endDate: latestEnd },
        nextPeriod: { startDate: nextStart, endDate: nextEnd },
        carryForward: prefs.carryForwardBudget,
        budgetsCreated: resetCount,
      });

      results.push({
        userId,
        status: "reset",
        period: {
          startDate: latestStart.toISOString(),
          endDate: latestEnd.toISOString(),
        },
        nextPeriod: {
          startDate: nextStart.toISOString(),
          endDate: nextEnd.toISOString(),
        },
        carryForward: prefs.carryForwardBudget,
        budgetsCreated: resetCount,
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
    reset,
    skipped,
    errors,
  });

  return { processed, reset, skipped, errors, results };
};

module.exports = { processBudgetReset };
