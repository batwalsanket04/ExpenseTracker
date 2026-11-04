const { Expense, User } = require("../models");
const { logError } = require("../config/logger");
const { Op } = require("sequelize");

const ALLOWED_CATEGORIES = [
  "Food",
  "Petrol",
  "Bills",
  "Shopping",
  "Entertainment",
  "Other",
];

const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, note } = req.body;
    const userId = req.user.id;

    if (!title || !amount) {
      return res.status(400).json({ message: "Title and amount are required" });
    }

    // Normalize category: only predefined categories are allowed; anything else
    // falls back to "Other" so reports never show unnecessary categories.
    const normalizedCategory = ALLOWED_CATEGORIES.includes(category)
      ? category
      : "Other";

    const newExpense = await Expense.create({
      userId,
      title,
      amount,
      category: normalizedCategory,
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

    const {
      page,
      limit,
      offset,
    } = getPagination(req.query);

    const { category, minAmount, maxAmount, startDate, endDate, search } = req.query;

    const where = userId ? { userId } : {};

    // Category filter (exact match). Empty string is treated as "no filter".
    if (category && category.trim()) where.category = category.trim();

    // Amount range filter. Empty / non-numeric values are ignored so that a
    // blank min or max field never breaks the other filter or the whole query.
    const parsedMin = parseAmount(minAmount);
    const parsedMax = parseAmount(maxAmount);
    if (parsedMin !== null || parsedMax !== null) {
      where.amount = {};
      if (parsedMin !== null) where.amount[Op.gte] = parsedMin;
      if (parsedMax !== null) where.amount[Op.lte] = parsedMax;
    }

    // Date range filter (inclusive, end of day). Date-only strings are
    // interpreted in local calendar time so a single-date filter (start === end)
    // covers the whole day regardless of server timezone. Invalid dates are
    // ignored so one bad value never breaks the other filters.
    const start = parseDateParam(startDate, false);
    const end = parseDateParam(endDate, true);
    if (start) where.date = { ...(where.date || {}), [Op.gte]: start };
    if (end) where.date = { ...(where.date || {}), [Op.lte]: end };

    // Search by title or note
    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: like } },
        { note: { [Op.iLike]: like } },
      ];
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      order: getSort(req.query.sort),
      limit,
      offset,
    });

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logError(req, "Get expenses failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Parse and sanitize pagination params.
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10) || 20)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Map sort param to Sequelize order clause.
 */
const getSort = (sort) => {
  const map = {
    newest: [["date", "DESC"]],
    oldest: [["date", "ASC"]],
    highest: [["amount", "DESC"]],
    lowest: [["amount", "ASC"]],
  };
  return map[sort] || map.newest;
};

/**
 * Parse an amount query value into a finite number.
 * Returns null for missing, empty, or non-numeric values so callers can tell
 * "not provided" apart from an invalid value.
 */
const parseAmount = (value) => {
  if (value == null || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
};

/**
 * Parse a date query value into a Date.
 *
 * - date-only strings ("YYYY-MM-DD") are interpreted in local calendar time,
 *   so start and end of a single day use the same timezone offset.
 * - full ISO datetimes are parsed normally.
 * - `endOfDay` sets the time to 23:59:59.999 (inclusive end of day).
 * Returns null for missing, empty, or unparseable values.
 */
const parseDateParam = (value, endOfDay = false) => {
  if (value == null || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let date;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (
      date.getFullYear() !== Number(y) ||
      date.getMonth() !== Number(mo) - 1 ||
      date.getDate() !== Number(d)
    ) {
      return null;
    }
  } else {
    date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
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
