const express = require("express");
const {
  getBudgetPreferences,
  updateBudgetPreferences,
  getBudgetAlerts,
} = require("../controllers/budgetPreference.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getBudgetPreferences);
router.put("/", protect, updateBudgetPreferences);
router.get("/alerts", protect, getBudgetAlerts);

module.exports = router;
