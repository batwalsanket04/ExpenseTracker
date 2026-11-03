const { Expense, User } = require("../models");
const { logError } = require("../config/logger");

const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, note } = req.body;
    const userId = req.user.id;

    if (!title || !amount) {
      return res.status(400).json({ message: "Title and amount are required" });
    }

    const newExpense = await Expense.create({
      userId,
      title,
      amount,
      category: category || "Other",
      date: date || new Date(),
      note: note || "",
    });

    return res.status(201).json({
      message: "Expense added",
      data: newExpense,
    });
  } catch (error) {
    logError(req, "Add expense failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getExpense = async (req, res) => {
  try {
    // Users see their own expenses; admins see all (or filter by ?userId=)
    let { userId } = req.query;
    if (!userId) {
      if (req.user.role !== "admin") {
        userId = req.user.id;
      }
      // admin with no userId -> fetch all expenses below
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admins only can view other users' expenses" });
    }

    const where = userId ? { userId } : {};
    const data = await Expense.findAll({ where, order: [["date", "DESC"]] });
    return res.status(200).json(data);
  } catch (error) {
    logError(req, "Get expenses failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getExpByID = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    // Ownership check unless admin
    if (req.user.role !== "admin" && expense.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your expense" });
    }
    return res.status(200).json(expense);
  } catch (error) {
    logError(req, "Get expense by id failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (req.user.role !== "admin" && expense.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your expense" });
    }
    await expense.destroy();
    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    logError(req, "Delete expense failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (req.user.role !== "admin" && expense.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: not your expense" });
    }
    await expense.update(req.body);
    const updated = await Expense.findByPk(id);
    return res.status(200).json({
      message: "Expense updated successfully",
      updated,
    });
  } catch (error) {
    logError(req, "Update expense failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addExpense,
  getExpense,
  getExpByID,
  updateExpense,
  deleteExpense,
};
