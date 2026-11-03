const { Credit } = require("../models");
const { logError } = require("../config/logger");

const AddCredit = async (req, res) => {
  try {
    const { source, amount, date, method, note } = req.body;
    const userId = req.user.id;

    if (!source || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: "Source, amount and date are required",
      });
    }

    const credit = await Credit.create({
      userId,
      source,
      amount,
      date,
      method: method || "",
      note: note || "",
    });
    return res.status(201).json({
      success: true,
      message: "Credit added",
      data: credit,
    });
  } catch (error) {
    logError(req, "Add credit failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const ShowCredit = async (req, res) => {
  try {
    // Users see their own credits; admins see all (or filter by ?userId=)
    let { userId } = req.query;
    if (!userId) {
      if (req.user.role !== "admin") {
        userId = req.user.id;
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admins only can view other users' credits",
      });
    }

    const where = userId ? { userId } : {};
    const credits = await Credit.findAll({
      where,
      order: [["date", "DESC"]],
    });
    return res.status(200).json({ success: true, data: credits });
  } catch (error) {
    logError(req, "Get credits failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const showCreditById = async (req, res) => {
  try {
    const { id } = req.params;
    const credit = await Credit.findByPk(id);
    if (!credit) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    if (req.user.role !== "admin" && credit.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your credit" });
    }
    return res.status(200).json(credit);
  } catch (error) {
    logError(req, "Get credit by id failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const credit = await Credit.findByPk(id);
    if (!credit) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    if (req.user.role !== "admin" && credit.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your credit" });
    }
    await credit.destroy();
    return res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    logError(req, "Delete credit failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const { source, amount, date, method, note } = req.body;
    const credit = await Credit.findByPk(id);
    if (!credit) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }
    if (req.user.role !== "admin" && credit.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your credit" });
    }
    await credit.update({ source, amount, date, method, note });
    const updated = await Credit.findByPk(id);
    return res.status(200).json({
      success: true,
      message: "Credit updated successfully",
      credit: updated,
    });
  } catch (error) {
    logError(req, "Update credit failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  AddCredit,
  ShowCredit,
  showCreditById,
  deleteCredit,
  updateCredit,
};
