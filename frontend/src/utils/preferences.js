export const PREFERENCES_KEY = "expenseTrackerPreferences";

export const defaultPreferences = {
  monthlySummary: true,
  budgetAlerts: true,
  compactTables: false,
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
