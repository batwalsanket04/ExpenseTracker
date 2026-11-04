const { BudgetPreference, Budget, Expense, Notification } = require("../models");
const { createNotification } = require("./notification.controller");
const { logError } = require("../config/logger");
const { Op } = require("sequelize");

/**
 * GET /api/budget-preferences/
 * Return the authenticated user's budget preferences, creating defaults if none exist.
 */
const getBudgetPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preference = await BudgetPreference.findOne({ where: { userId } });

    if (!preference) {
      preference = await BudgetPreference.create({ userId });
    }

    return res.status(200).json({
      success: true,
      message: "Budget preferences loaded",
      data: preference,
    });
  } catch (error) {
    logError(req, "Get budget preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/budget-preferences/
 * Upsert the authenticated user's budget preferences.
 */
const updateBudgetPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      monthlyBudget,
      budgetPeriod,
      alertThreshold,
      enableBudgetAlert,
      enableEmailAlert,
      enableInAppAlert,
      carryForwardBudget,
      autoResetBudget,
    } = req.body;

    let preference = await BudgetPreference.findOne({ where: { userId } });

    if (!preference) {
      preference = await BudgetPreference.create({
        userId,
        monthlyBudget,
        budgetPeriod,
        alertThreshold,
        enableBudgetAlert,
        enableEmailAlert,
        enableInAppAlert,
        carryForwardBudget,
        autoResetBudget,
      });
    } else {
      await preference.update({
        monthlyBudget,
        budgetPeriod,
        alertThreshold,
        enableBudgetAlert,
        enableEmailAlert,
        enableInAppAlert,
        carryForwardBudget,
        autoResetBudget,
      });
      preference = await BudgetPreference.findOne({ where: { userId } });
    }

    return res.status(200).json({
      success: true,
      message: "Budget preferences saved successfully",
      data: preference,
    });
  } catch (error) {
    logError(req, "Update budget preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/budget-preferences/alerts
 * Check which budgets have exceeded the alert threshold and return alerts.
 */
const getBudgetAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's budget preferences
    let preference = await BudgetPreference.findOne({ where: { userId } });
    if (!preference) {
      preference = await BudgetPreference.create({ userId });
    }

    const {
      monthlyBudget,
      budgetPeriod,
      alertThreshold,
      enableBudgetAlert,
      enableInAppAlert,
      enableEmailAlert,
    } = preference;

    if (!enableBudgetAlert || !enableInAppAlert) {
      return res.status(200).json({
        success: true,
        message: "Budget alerts are disabled",
        data: [],
        preferences: {
          enableBudgetAlert,
          enableInAppAlert,
          enableEmailAlert,
          alertThreshold,
        },
      });
    }

    // Fetch all budgets for the user
    const budgets = await Budget.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // Avoid duplicate notifications: don't re-alert a budget that already
    // has a persisted budget_alert notification.
    const existingAlertNotifications = await Notification.findAll({
      where: { userId, type: "budget_alert" },
      attributes: ["data"],
    });
    const notifiedBudgetIds = new Set(
      existingAlertNotifications
        .map((n) => (n.data || {}).budgetId)
        .filter(Boolean)
    );

    const alerts = [];

    for (const budget of budgets) {
      // Calculate spent from expenses in this budget's date range and category
      const expenses = await Expense.findAll({
        where: {
          userId,
          category: budget.category,
          date: {
            [Op.gte]: budget.startDate,
            [Op.lte]: budget.endDate,
          },
        },
      });

      const spent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const allocated = Number(budget.amount || 0);
      const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

      // Update spent in DB
      await budget.update({ spent });

      // Check if threshold is crossed
      if (percentage >= alertThreshold) {
        const remaining = Math.max(0, allocated - spent);
        const isOver = percentage >= 100;

        alerts.push({
          budgetId: budget.id,
          category: budget.category,
          allocated,
          spent,
          remaining,
          percentage,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          isOver,
          isWarning: percentage >= alertThreshold && percentage < 100,
          threshold: alertThreshold,
          message: isOver
            ? `Your ${budget.category} budget is exceeded (${percentage}% of ₹${allocated})`
            : `Your ${budget.category} budget is at ${percentage}% (₹${spent} of ₹${allocated})`,
        });

        // Persist over-100% budget alerts as in-app notifications so they show
        // in the Notifications page and outlive a toast. One notification per
        // over-budget budget (deduplicated above).
        if (isOver && enableInAppAlert && !notifiedBudgetIds.has(budget.id)) {
          await createNotification({
            userId,
            type: "budget_alert",
            title: `Budget exceeded: ${budget.category}`,
            message: `You have spent more than 100% of your ${budget.category} budget (₹${spent} of ₹${allocated}).`,
            data: {
              budgetId: budget.id,
              category: budget.category,
              allocated,
              spent,
              percentage,
              remaining: Math.max(0, allocated - spent),
              isOver: true,
              threshold: alertThreshold,
            },
            req,
          });
          notifiedBudgetIds.add(budget.id);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: alerts.length > 0 ? "Budget alerts found" : "All budgets are within limits",
      data: alerts,
      preferences: {
        enableBudgetAlert,
        enableInAppAlert,
        enableEmailAlert,
        alertThreshold,
        monthlyBudget,
        budgetPeriod,
      },
    });
  } catch (error) {
    logError(req, "Get budget alerts failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getBudgetPreferences,
  updateBudgetPreferences,
  getBudgetAlerts,
};
