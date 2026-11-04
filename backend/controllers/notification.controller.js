const { Notification } = require("../models");
const { logError } = require("../config/logger");
const { publishChange } = require("../config/notificationCache");

/**
 * Create an in-app notification for a user.
 *
 * @param {Object} params
 * @param {string} params.userId - target user id
 * @param {string} params.type - budget_alert | expense_reminder | weekly_summary | monthly_summary | system
 * @param {string} params.title
 * @param {string} params.message
 * @param {Object} [params.data] - optional structured payload
 * @param {Object} [params.req] - express request (for audit logging)
 * @returns {Promise<Object|null>} the created notification or null on failure
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  data,
  req,
} = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || null,
    });

    // Broadcast so other server instances / real-time listeners can react.
    try {
      await publishChange(userId, {
        event: "notification:created",
        notification: notification.get({ plain: true }),
        createdAt: new Date().toISOString(),
      });
    } catch (publishErr) {
      // Never let a failed pub/sub break notification creation.
      const { logger } = require("../config/logger");
      logger.warn("Notification publish failed", {
        userId,
        error: publishErr.message,
      });
    }

    // Audit log (best effort).
    try {
      const { auditLogger } = require("../middleware/auditLogger");
      await auditLogger({
        userId,
        action: "NOTIFICATION_CREATE",
        module: "notification",
        details: `${type}: ${title}`,
        req,
      });
    } catch (auditErr) {
      // auditLogger swallows internally; guard anyway.
    }

    return notification.get({ plain: true });
  } catch (error) {
    logError(req, "Create notification failed", error);
    return null;
  }
};

/**
 * GET /api/notifications/
 * Return the authenticated user's notifications (newest first).
 * Query: limit, unreadOnly
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50)
    );
    const unreadOnly = req.query.unreadOnly === "true";

    const where = { userId };
    if (unreadOnly) where.read = false;

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit,
    });

    const unreadCount = await Notification.count({
      where: { userId, read: false },
    });

    return res.status(200).json({
      success: true,
      message: "Notifications loaded",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    logError(req, "Get notifications failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({ read: true });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification.get({ plain: true }),
    });
  } catch (error) {
    logError(req, "Mark notification read failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all of the authenticated user's notifications as read.
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update({ read: true }, { where: { userId } });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    logError(req, "Mark all notifications read failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification (owned by the authenticated user).
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    logError(req, "Delete notification failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Return the count of unread notifications for the authenticated user.
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.count({
      where: { userId, read: false },
    });
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    logError(req, "Get unread count failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
};
