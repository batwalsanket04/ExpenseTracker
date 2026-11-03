const express = require("express");
const {
  addExpense,
  getExpense,
  getExpByID,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenses.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/user", protect, getExpense);        // query: ?userId= (admin only for others)
router.get("/:id", protect, getExpByID);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

module.exports = router;
