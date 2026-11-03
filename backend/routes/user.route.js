const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// List all users - admin only
router.get("/", protect, authorize("admin"), getUsers);

// Get user by id
router.get("/:id", protect, getUserById);

// Update user
router.put("/:id", protect, updateUser);

// Delete user - admin only
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
