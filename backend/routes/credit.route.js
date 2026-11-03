const express = require("express");
const {
  AddCredit,
  ShowCredit,
  showCreditById,
  deleteCredit,
  updateCredit,
} = require("../controllers/credit.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, AddCredit);
router.get("/user", protect, ShowCredit);        // query: ?userId= (admin only for others)
router.get("/:id", protect, showCreditById);
router.put("/:id", protect, updateCredit);
router.delete("/:id", protect, deleteCredit);

module.exports = router;
