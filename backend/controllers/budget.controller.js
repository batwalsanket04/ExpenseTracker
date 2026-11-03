const { Budget, Expense } = require("../models");
const { logError } = require("../config/logger");

const addBudget = async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!category || !amount || !startDate || !endDate) {
      return res.status(400).json({
        message: "Category, amount, start date and end date are required",
      });
    }

    const budget = await Budget.create({
      userId,
      category,
      amount,
      period: period || "monthly",
      startDate,
      endDate,
      spent: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    logError(req, "Add budget failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // Calculate spent for each budget from expenses
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.findAll({
          where: {
            userId,
            category: budget.category,
            date: {
              [require("sequelize").Op.gte]: budget.startDate,
              [require("sequelize").Op.lte]: budget.endDate,
            },
          },
        });
        const spent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        await budget.update({ spent });
        return {
          ...budget.toJSON(),
          spent,
          remaining: Math.max(0, Number(budget.amount) - spent),
          percentage: Math.min(100, Math.round((spent / Number(budget.amount)) * 100)),
        };
      })
    );

    return res.status(200).json({ success: true, data: budgetsWithSpent });
  } catch (error) {
    logError(req, "Get budgets failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, period, startDate, endDate } = req.body;
    const userId = req.user.id;

    const budget = await Budget.findOne({ where: { id, userId } });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    await budget.update({ amount, period, startDate, endDate });
    return res.status(200).json({ success: true, message: "Budget updated", data: budget });
  } catch (error) {
    logError(req, "Update budget failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findOne({ where: { id, userId } });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    await budget.destroy();
    return res.status(200).json({ success: true, message: "Budget deleted" });
  } catch (error) {
    logError(req, "Delete budget failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
