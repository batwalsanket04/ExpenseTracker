import React, { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  Layout,
  Lock,
  Mail,
  Monitor,
  PieChart,
  Save,
  Settings,
  ShieldCheck,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import {
  loadPreferences,
  savePreferences,
  fetchNotificationPreferences,
  saveNotificationPreferences,
  extractNotificationPrefs,
} from "../../utils/preferences";
import { PageHeader } from "../../components/ui";

const NOTIFICATION_KEYS = [
  "emailNotifications",
  "inAppNotifications",
  "expenseReminder",
  "weeklySummary",
  "monthlySummary",
];

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Card", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "Bank Transfer", label: "Bank Transfer" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR ₹" },
  { value: "USD", label: "USD $" },
  { value: "EUR", label: "EUR €" },
];

const REPORT_FORMAT_OPTIONS = [
  { value: "PDF", label: "PDF" },
  { value: "CSV", label: "CSV" },
  { value: "Excel", label: "Excel" },
];

const REPORT_SCHEDULE_OPTIONS = [
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
];

const TIMEZONE_OPTIONS = [
  { value: "IST (UTC+5:30)", label: "IST (UTC+5:30)" },
  { value: "EST (UTC-5:00)", label: "EST (UTC-5:00)" },
  { value: "PST (UTC-8:00)", label: "PST (UTC-8:00)" },
  { value: "GMT (UTC+0:00)", label: "GMT (UTC+0:00)" },
];

const CATEGORY_OPTIONS = [
  { value: "Food", label: "Food" },
  { value: "Transport", label: "Transport" },
  { value: "Shopping", label: "Shopping" },
  { value: "Bills", label: "Bills" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Other", label: "Other" },
];

const initialBudgetPreferences = {
  monthlyBudget: 20000,
  budgetPeriod: "monthly",
  alertThreshold: 80,
  enableBudgetAlert: true,
  carryForwardBudget: false,
};

const ToggleRow = ({ title, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3.5">
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
        <Monitor size={15} />
      </span>
      <div>
        <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      onClick={onChange}
      className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-teal-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

const PreferencesMatrix = () => {
  const [preferences, setPreferences] = useState(() => loadPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAllPreferences = async () => {
      try {
        // Budget preferences from backend
        const response = await api.get("/budget-preferences/");
        const data = response.data.data || {};
        setPreferences((current) => ({
          ...current,
          monthlyBudget: data.monthlyBudget ?? initialBudgetPreferences.monthlyBudget,
          budgetPeriod: data.budgetPeriod ?? initialBudgetPreferences.budgetPeriod,
          alertThreshold: data.alertThreshold ?? initialBudgetPreferences.alertThreshold,
          enableBudgetAlert: data.enableBudgetAlert ?? initialBudgetPreferences.enableBudgetAlert,
          carryForwardBudget: data.carryForwardBudget ?? initialBudgetPreferences.carryForwardBudget,
        }));
      } catch (error) {
        console.log("Fetch budget preferences error:", error);
      }

      // Notification preferences from backend (source of truth), merged into localStorage
      try {
        const merged = await fetchNotificationPreferences(api);
        setPreferences(merged);
      } catch (error) {
        console.log("Fetch notification preferences error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPreferences();
  }, []);

  const togglePreference = (key) => {
    const isNotification = NOTIFICATION_KEYS.includes(key);
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      savePreferences(next);
      if (isNotification) {
        // Sync to backend (fire-and-forget; errors handled inside)
        saveNotificationPreferences(api, extractNotificationPrefs(next));
      }
      return next;
    });
  };

  const setPreference = (key, value) => {
    const isNotification = NOTIFICATION_KEYS.includes(key);
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      savePreferences(next);
      if (isNotification) {
        saveNotificationPreferences(api, extractNotificationPrefs(next));
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put("/budget-preferences/", {
        monthlyBudget: preferences.monthlyBudget,
        budgetPeriod: preferences.budgetPeriod,
        alertThreshold: preferences.alertThreshold,
        enableBudgetAlert: preferences.enableBudgetAlert,
        carryForwardBudget: preferences.carryForwardBudget,
      });
      toast.success(response.data.message || "Budget preferences saved");
    } catch (error) {
      console.log("Save budget preferences error:", error);
      toast.error(
        error.response?.data?.message || "Could not save budget preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        subtitle="Manage your workspace preferences across budget, notifications, expenses, reports, and appearance."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving && <Save size={14} className="mr-2 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      {loading ? (
        <div className="surface p-5 sm:p-6 flex flex-col items-center justify-center py-20">
          <span className="animate-spin text-teal-600" />
          <p className="mt-3 text-xs text-slate-500">Loading preferences…</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Profile Settings */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <User size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Profile Settings
                </h2>
                <p className="text-[11px] text-slate-500">
                  Manage your personal account information and security.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 py-3 px-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-100">
                    <User size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-800">
                      Personal Information
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Name, email and profile details
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Edit</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 px-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-100">
                    <Lock size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-800">
                      Change Password
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Update your account password
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Edit</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 px-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-100">
                    <ShieldCheck size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-800">
                      Security
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Two-factor authentication and session management
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Edit</span>
              </div>
            </div>
          </div>

          {/* Budget Preferences */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                <Wallet size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Budget Preferences
                </h2>
                <p className="text-[11px] text-slate-500">
                  Set your spending limits and budget behavior.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Wallet size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Budget Limit
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Overall spending limit per period
                    </p>
                  </div>
                </div>
                <div className="relative w-48">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-semibold"
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    name="monthlyBudget"
                    value={preferences.monthlyBudget || ""}
                    onChange={(e) =>
                      setPreference("monthlyBudget", Number(e.target.value) || 0)
                    }
                    min="0"
                    step="1"
                    className="field pl-8 h-[42px] py-0 pr-3 text-slate-600 w-full"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <PieChart size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Budget Period
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      How often the budget resets
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.budgetPeriod}
                  onChange={(e) => setPreference("budgetPeriod", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Bell size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Alert Threshold
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Notify at this percent of budget
                    </p>
                  </div>
                </div>
                <div className="relative w-48">
                  <input
                    type="number"
                    name="alertThreshold"
                    value={preferences.alertThreshold || ""}
                    onChange={(e) =>
                      setPreference(
                        "alertThreshold",
                        Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      )
                    }
                    min="1"
                    max="100"
                    step="1"
                    className="field pr-8 h-[42px] py-0 pl-3 text-slate-600 w-full"
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-semibold"
                  >
                    %
                  </span>
                </div>
              </div>
              <ToggleRow
                title="Budget Alerts"
                description="Notify when spending crosses threshold"
                checked={preferences.enableBudgetAlert}
                onChange={() => togglePreference("enableBudgetAlert")}
              />
              <ToggleRow
                title="Carry Forward Budget"
                description="Roll unused budget into next period"
                checked={preferences.carryForwardBudget}
                onChange={() => togglePreference("carryForwardBudget")}
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <Bell size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Notification Preferences
                </h2>
                <p className="text-[11px] text-slate-500">
                  Choose how you want to be notified.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <ToggleRow
                title="Email Notifications"
                description="Receive alerts and digests by email"
                checked={preferences.emailNotifications}
                onChange={() => togglePreference("emailNotifications")}
              />
              <ToggleRow
                title="In-App Notifications"
                description="Show notifications inside the app"
                checked={preferences.inAppNotifications}
                onChange={() => togglePreference("inAppNotifications")}
              />
              <ToggleRow
                title="Expense Reminder"
                description="Remind to log expenses daily"
                checked={preferences.expenseReminder}
                onChange={() => togglePreference("expenseReminder")}
              />
              <ToggleRow
                title="Weekly Summary"
                description="Get a summary every week"
                checked={preferences.weeklySummary}
                onChange={() => togglePreference("weeklySummary")}
              />
              <ToggleRow
                title="Monthly Summary"
                description="Get a summary every month"
                checked={preferences.monthlySummary}
                onChange={() => togglePreference("monthlySummary")}
              />
            </div>
          </div>

          {/* Expense Preferences */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <Tag size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Expense Preferences
                </h2>
                <p className="text-[11px] text-slate-500">
                  Default values for new expense entries.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Tag size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Default Category
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Pre-selected category for new expenses
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.defaultCategory}
                  onChange={(e) => setPreference("defaultCategory", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <CreditCard size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Default Payment Method
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Pre-selected payment method for new expenses
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.defaultPaymentMethod}
                  onChange={(e) =>
                    setPreference("defaultPaymentMethod", e.target.value)
                  }
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Globe size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Default Currency
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Currency for all expense amounts
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.defaultCurrency}
                  onChange={(e) => setPreference("defaultCurrency", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Report Preferences */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <FileText size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Report Preferences
                </h2>
                <p className="text-[11px] text-slate-500">
                  Configure how your reports are generated.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <FileText size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Report Format
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      File format for exported reports
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.reportFormat}
                  onChange={(e) => setPreference("reportFormat", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {REPORT_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <CalendarDays size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Report Schedule
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      How often reports are generated
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.reportSchedule}
                  onChange={(e) => setPreference("reportSchedule", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {REPORT_SCHEDULE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <ToggleRow
                title="Include Charts"
                description="Show charts in exported reports"
                checked={preferences.includeCharts}
                onChange={() => togglePreference("includeCharts")}
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="surface p-5 sm:p-6 col-span-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                <Layout size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Appearance
                </h2>
                <p className="text-[11px] text-slate-500">
                  Customize the look and feel of your workspace.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Monitor size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Theme
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Workspace appearance
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreference("theme", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Globe size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Language
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Interface language
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreference("language", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-0 pb-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <ClockIcon size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-800">
                      Time Zone
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Your local time zone
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.timeZone}
                  onChange={(e) => setPreference("timeZone", e.target.value)}
                  className="field h-[42px] py-0 pr-3 pl-10 text-slate-600 w-48 bg-white"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClockIcon = (props) => <CalendarDays {...props} />;

export default PreferencesMatrix;
