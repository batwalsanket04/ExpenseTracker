const express = require("express");
const {
  getNotificationPreferences,
  updateNotificationPreferences,
} = require("../controllers/notificationPreference.controller");
const {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  listAllNotificationPreferences,
} = require("../controllers/notificationPreference.controller");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// --- Authenticated user: manage their own preferences ---
router.get("/", protect, getNotificationPreferences);
router.put("/", protect, updateNotificationPreferences);

// --- Admin: manage any user's preferences ---
router.get("/admin/all", protect, authorize("admin"), listAllNotificationPreferences);
router.get(
  "/admin/:userId",
  protect,
  authorize("admin"),
  getUserNotificationPreferences
);
router.put(
  "/admin/:userId",
  protect,
  authorize("admin"),
  updateUserNotificationPreferences
);

module.exports = router;
