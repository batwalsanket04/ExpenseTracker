const express = require("express");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notification.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// List the authenticated user's notifications
// Query: limit, unreadOnly
router.get("/", protect, getNotifications);

// Unread count badge
router.get("/unread-count", protect, getUnreadCount);

// Mark all as read
router.patch("/read-all", protect, markAllNotificationsRead);

// Mark a single notification as read / delete
router.patch("/:id/read", protect, markNotificationRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
