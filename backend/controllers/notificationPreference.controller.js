const {
  NotificationPreference,
  User,
  Admin,
} = require("../models");
const { logError } = require("../config/logger");
const {
  getCached,
  setCached,
  delCached,
  publishChange,
} = require("../config/notificationCache");
const {
  sendPreferenceChangeConfirmation,
} = require("../services/emailService");
const { auditLogger } = require("../middleware/auditLogger");

/**
 * Default preferences applied when a user has no persisted record yet.
 */
const DEFAULT_PREFS = {
  emailNotifications: true,
  inAppNotifications: true,
  expenseReminder: true,
  weeklySummary: true,
  monthlySummary: true,
};

/**
 * Normalize raw request body into the whitelisted preference fields.
 */
const normalizePrefs = (body) => {
  const prefs = {};
  const allowed = [
    "emailNotifications",
    "inAppNotifications",
    "expenseReminder",
    "weeklySummary",
    "monthlySummary",
  ];
  allowed.forEach((key) => {
    if (key in body) {
      prefs[key] = body[key] === true || body[key] === "true";
    }
  });
  return prefs;
};

/**
 * Persist preferences (create or update), refresh cache, publish change event.
 * Notification preferences always live on the NotificationPreference model
 * (userId is a foreign key -> users table).
 */
const persistPreferences = async (userId, prefs, actorId) => {
  let pref = await NotificationPreference.findOne({ where: { userId } });

  if (!pref) {
    pref = await NotificationPreference.create({
      userId,
      ...DEFAULT_PREFS,
      ...prefs,
    });
  } else {
    await pref.update(prefs);
    pref = await NotificationPreference.findOne({ where: { userId } });
  }

  const plain = pref.get({ plain: true });

  // Refresh Redis cache and notify other instances.
  await setCached(userId, plain);
  await publishChange(userId, plain);

  // Audit log (best effort; never breaks the response).
  try {
    await auditLogger({
      userId: actorId,
      action: "NOTIFICATION_PREFERENCES_UPDATE",
      module: "notification",
      details: `Updated notification preferences for user ${userId}: ${JSON.stringify(prefs)}`,
    });
  } catch (error) {
    // auditLogger already swallows internally; guard anyway.
  }

  return plain;
};

/**
 * GET /api/notification-preferences/
 * Return the authenticated user's notification preferences (with Redis cache).
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try Redis cache first.
    const cached = await getCached(userId);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Notification preferences loaded",
        data: cached,
        source: "cache",
      });
    }

    let pref = await NotificationPreference.findOne({ where: { userId } });

    if (!pref) {
      pref = await NotificationPreference.create({ userId, ...DEFAULT_PREFS });
    }

    const plain = pref.get({ plain: true });
    await setCached(userId, plain);

    return res.status(200).json({
      success: true,
      message: "Notification preferences loaded",
      data: plain,
      source: "database",
    });
  } catch (error) {
    logError(req, "Get notification preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/notification-preferences/
 * Upsert the authenticated user's own notification preferences.
 * Sends a confirmation email when emailNotifications changes.
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const prefs = normalizePrefs(req.body);

    if (Object.keys(prefs).length === 0) {
      return res.status(400).json({
        message: "No valid notification preference fields provided",
        allowed: [
          "emailNotifications",
          "inAppNotifications",
          "expenseReminder",
          "weeklySummary",
          "monthlySummary",
        ],
      });
    }

    const existing = await NotificationPreference.findOne({ where: { userId } });
    const previous = existing
      ? existing.get({ plain: true })
      : { userId, ...DEFAULT_PREFS };

    const updated = await persistPreferences(userId, prefs, req.user.id);

    // Send confirmation email when email preference toggles (and email is enabled).
    const emailChanged =
      previous.emailNotifications !== updated.emailNotifications;
    if (
      emailChanged &&
      updated.emailNotifications &&
      req.user.email
    ) {
      await sendPreferenceChangeConfirmation({
        to: req.user.email,
        name: req.user.name,
        updatedPreferences: updated,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification preferences saved successfully",
      data: updated,
    });
  } catch (error) {
    logError(req, "Update notification preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/notification-preferences/:userId
 * Admin: view any user's notification preferences.
 */
const getUserNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const cached = await getCached(userId);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "User notification preferences loaded",
        data: cached,
        source: "cache",
      });
    }

    // Look across both users and admins tables.
    let user = await User.findByPk(userId);
    if (!user) user = await Admin.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let pref = await NotificationPreference.findOne({ where: { userId } });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        ...DEFAULT_PREFS,
      });
    }

    const plain = pref.get({ plain: true });
    await setCached(userId, plain);

    return res.status(200).json({
      success: true,
      message: "User notification preferences loaded",
      data: plain,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      source: "database",
    });
  } catch (error) {
    logError(req, "Get user notification preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/admin/notification-preferences/:userId
 * Admin: update any user's notification preferences.
 */
const updateUserNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = normalizePrefs(req.body);

    if (Object.keys(prefs).length === 0) {
      return res.status(400).json({
        message: "No valid notification preference fields provided",
        allowed: [
          "emailNotifications",
          "inAppNotifications",
          "expenseReminder",
          "weeklySummary",
          "monthlySummary",
        ],
      });
    }

    // Verify target user exists.
    let targetUser = await User.findByPk(userId);
    if (!targetUser) targetUser = await Admin.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Notification preferences live on the NotificationPreference model
    // (userId is a foreign key -> users table).
    const updated = await persistPreferences(userId, prefs, req.user.id);

    // Send confirmation email when email preference toggles on.
    const existing = await NotificationPreference.findOne({ where: { userId } });
    const previous = existing
      ? existing.get({ plain: true })
      : { ...DEFAULT_PREFS };
    if (
      previous.emailNotifications !== updated.emailNotifications &&
      updated.emailNotifications &&
      targetUser.email
    ) {
      await sendPreferenceChangeConfirmation({
        to: targetUser.email,
        name: targetUser.name,
        updatedPreferences: updated,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User notification preferences saved successfully",
      data: updated,
    });
  } catch (error) {
    logError(req, "Update user notification preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/notification-preferences
 * Admin: list notification preferences for all users (with pagination).
 */
const listAllNotificationPreferences = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await NotificationPreference.findAndCountAll({
      attributes: { exclude: [] },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Notification preferences listed",
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logError(req, "List notification preferences failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  listAllNotificationPreferences,
  persistPreferences,
  DEFAULT_PREFS,
};
