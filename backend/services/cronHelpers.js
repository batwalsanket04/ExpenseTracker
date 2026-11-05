/**
 * Shared helpers for cron jobs.
 *
 * All date ranges are computed in local calendar time so that date-only
 * boundaries match the expense controller's filtering (a single date covers
 * the whole local day regardless of server timezone).
 */

/** Default notification preferences applied when a user has no persisted row. */
const DEFAULT_NOTIFICATION_PREFS = {
  emailNotifications: true,
  inAppNotifications: true,
  expenseReminder: true,
  weeklySummary: true,
  monthlySummary: true,
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date = new Date()) => {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday = 0
  return d;
};

const endOfWeek = (date = new Date()) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6); // Saturday
  return endOfDay(d);
};

const startOfMonth = (date = new Date()) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const endOfMonth = (date = new Date()) => {
  const d = startOfMonth(date);
  d.setMonth(d.getMonth() + 1, 0); // last day of current month
  return endOfDay(d);
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Resolve a user's notification preferences, falling back to defaults when no
 * persisted record exists (e.g. a user who never opened the preferences page).
 */
const resolveNotificationPrefs = (userId, prefMap) => {
  const stored = prefMap[userId];
  if (!stored) return { ...DEFAULT_NOTIFICATION_PREFS };
  return {
    emailNotifications: stored.emailNotifications !== false,
    inAppNotifications: stored.inAppNotifications !== false,
    expenseReminder: stored.expenseReminder !== false,
    weeklySummary: stored.weeklySummary !== false,
    monthlySummary: stored.monthlySummary !== false,
  };
};

/**
 * Resolve a user's budget preferences, falling back to defaults.
 */
const resolveBudgetPrefs = (userId, prefMap) => {
  const stored = prefMap[userId];
  if (!stored) {
    return {
      monthlyBudget: 20000,
      budgetPeriod: "monthly",
      alertThreshold: 80,
      carryForwardBudget: false,
      autoResetBudget: true,
    };
  }
  return {
    monthlyBudget: Number(stored.monthlyBudget || 20000),
    budgetPeriod: stored.budgetPeriod || "monthly",
    alertThreshold: Number(stored.alertThreshold || 80),
    carryForwardBudget: stored.carryForwardBudget === true,
    autoResetBudget: stored.autoResetBudget !== false,
  };
};

/**
 * Sum a numeric `amount` field across model instances or plain objects.
 */
const sumAmounts = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

/**
 * Compute the next budget period [start, end] based on the current period's
 * end date and the user's budget period (weekly | monthly | yearly).
 */
const getNextPeriodDates = (currentEndDate, period) => {
  // The new period starts at the beginning of the day after the current one ends.
  const nextStart = startOfDay(addDays(currentEndDate, 1));

  let nextEnd;
  if (period === "weekly") {
    nextEnd = endOfDay(addDays(nextStart, 6));
  } else if (period === "yearly") {
    nextEnd = new Date(nextStart);
    nextEnd.setMonth(11, 31); // Dec 31 of nextStart's year
    nextEnd.setHours(23, 59, 59, 999);
  } else {
    // monthly (default): last day of nextStart's month
    nextEnd = endOfMonth(nextStart);
  }

  return { nextStart, nextEnd };
};

module.exports = {
  DEFAULT_NOTIFICATION_PREFS,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  resolveNotificationPrefs,
  resolveBudgetPrefs,
  sumAmounts,
  getNextPeriodDates,
};
