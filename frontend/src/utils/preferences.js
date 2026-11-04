export const PREFERENCES_KEY = "expenseTrackerPreferences";

export const defaultPreferences = {
  // Budget Preferences (synced with backend /api/budget-preferences)
  monthlyBudget: 20000,
  budgetPeriod: "monthly",
  alertThreshold: 80,
  enableBudgetAlert: true,
  carryForwardBudget: false,
  // Notification Preferences (synced with backend /api/notification-preferences)
  emailNotifications: true,
  inAppNotifications: true,
  expenseReminder: true,
  weeklySummary: true,
  monthlySummary: true,
  // Expense Preferences
  defaultCategory: "Food",
  defaultPaymentMethod: "Cash",
  defaultCurrency: "INR",
  // Report Preferences
  reportFormat: "PDF",
  reportSchedule: "Monthly",
  includeCharts: true,
  // Appearance
  theme: "light",
  language: "English",
  timeZone: "IST (UTC+5:30)",
};

export const loadPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
    return { ...defaultPreferences, ...stored };
  } catch {
    return { ...defaultPreferences };
  }
};

export const savePreferences = (preferences) => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
};

/* -------------------------------------------------------------------------- */
/*  Backend-synced notification preferences                                   */
/* -------------------------------------------------------------------------- */

const NOTIFICATION_KEYS = [
  "emailNotifications",
  "inAppNotifications",
  "expenseReminder",
  "weeklySummary",
  "monthlySummary",
];

/**
 * Extract only the notification preferences from a full preferences object.
 */
export const extractNotificationPrefs = (preferences) => {
  const prefs = {};
  NOTIFICATION_KEYS.forEach((key) => {
    if (key in preferences) prefs[key] = preferences[key];
  });
  return prefs;
};

/**
 * Merge server notification preferences into localStorage preferences.
 * Returns the merged object (caller should persist with savePreferences).
 */
export const mergeServerNotificationPrefs = (serverPrefs) => {
  const current = loadPreferences();
  const next = { ...current, ...serverPrefs };
  savePreferences(next);
  return next;
};

/**
 * Fetch the authenticated user's notification preferences from the backend.
 * Falls back to localStorage on failure.
 */
export const fetchNotificationPreferences = async (api) => {
  try {
    const { data } = await api.get("/notification-preferences/");
    const serverPrefs = data.data || {};
    return mergeServerNotificationPrefs(serverPrefs);
  } catch (error) {
    console.log("Fetch notification preferences error:", error);
    return loadPreferences();
  }
};

/**
 * Save the authenticated user's notification preferences to the backend and
 * keep localStorage in sync.
 */
export const saveNotificationPreferences = async (api, notificationPrefs) => {
  // Persist locally first for instant UI feedback.
  const next = mergeServerNotificationPrefs(notificationPrefs);
  try {
    await api.put("/notification-preferences/", notificationPrefs);
    return next;
  } catch (error) {
    console.log("Save notification preferences error:", error);
    // Keep the localStorage value so the UI stays consistent.
    return next;
  }
};
