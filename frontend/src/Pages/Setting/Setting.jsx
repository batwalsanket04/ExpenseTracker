import React, { useState } from "react";
import {
  Bell,
  Check,
  Database,
  Download,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Table2,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { useAuth } from "../../Context/storeContext";
import {
  Avatar,
  Badge,
  ConfirmDialog,
  PageHeader,
  Spinner,
} from "../../components/ui";
import { downloadJson } from "../../utils/download";
import { todayISO } from "../../utils/format";
import { loadPreferences, savePreferences } from "../../utils/preferences";

const ToggleRow = ({ icon: Icon, title, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-3.5">
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
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

const Settings = () => {
  const { user, role, logout } = useAuth();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [showLogout, setShowLogout] = useState(false);
  const [exporting, setExporting] = useState(false);

  const displayName = user?.name || localStorage.getItem("userName") || "User";
  const displayEmail = user?.email || "—";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  const togglePreference = (key) => {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      savePreferences(next);
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [expenseResponse, creditResponse] = await Promise.all([
        api.get("/expense/user"),
        api.get("/credit/user"),
      ]);

      downloadJson(`expense-tracker-data-${todayISO()}.json`, {
        exportedAt: new Date().toISOString(),
        profile: { name: displayName, email: displayEmail, role: roleLabel },
        expenses: expenseResponse.data || [],
        credits:
          creditResponse.data && Array.isArray(creditResponse.data.data)
            ? creditResponse.data.data
            : [],
      });

      toast.success("Your data export is ready");
    } catch (error) {
      console.log("Export data error:", error);
      toast.error("Could not prepare your data export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile, preferences and data. Your workspace settings save automatically."
        actions={
          <Badge tone="emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {roleLabel} account
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-7">
          {/* Profile */}
          <div className="surface overflow-hidden">
            <div className="relative h-24 bg-[#102a25]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-teal-500/25 blur-2xl" />
                <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-teal-500/15 blur-2xl" />
                <div className="absolute inset-0 bg-grid opacity-30" />
              </div>
            </div>

            <div className="relative z-10 px-5 pb-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-3">
                  <Avatar
                    name={displayName}
                    size="xl"
                    className="-mt-8 ring-4 ring-white"
                  />
                  <div className="pb-1">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {displayName}
                    </h2>
                    <p className="text-xs text-slate-500">{displayEmail}</p>
                  </div>
                </div>
                <Badge tone={role === "admin" ? "violet" : "indigo"}>
                  <ShieldCheck size={11} />
                  {roleLabel}
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">Full name</label>
                  <div className="relative">
                    <UserRound
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={displayName}
                      readOnly
                      className="field field-icon h-[42px] py-0 text-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-field">Email address</label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={displayEmail}
                      readOnly
                      className="field field-icon h-[42px] py-0 text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
                <Lock size={11} className="mt-0.5 shrink-0" />
                Profile details are linked to your secure account and cannot be changed
                here.
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Preferences
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Choose how the workspace communicates with you.
                </p>
              </div>
              <span className="badge bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Check size={10} />
                Saved
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              <ToggleRow
                icon={Bell}
                title="Budget alerts"
                description="Highlight category budgets that pass 75% of their limit."
                checked={preferences.budgetAlerts}
                onChange={() => togglePreference("budgetAlerts")}
              />
              <ToggleRow
                icon={Mail}
                title="Monthly summary"
                description="Show monthly income and net balance cards on your dashboard."
                checked={preferences.monthlySummary}
                onChange={() => togglePreference("monthlySummary")}
              />
              <ToggleRow
                icon={Table2}
                title="Compact tables"
                description="Use tighter row spacing in expense and income tables on large screens."
                checked={preferences.compactTables}
                onChange={() => togglePreference("compactTables")}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-teal-500 ring-1 ring-slate-100">
                  <Wallet size={15} />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Currency</p>
                  <p className="text-[10.5px] text-slate-500">
                    All amounts are shown in Indian Rupees
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                INR ₹
              </span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 xl:col-span-5">
          {/* Security */}
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <ShieldCheck size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Security
                </h2>
                <p className="text-[11px] text-slate-500">Your session is protected</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  icon: KeyRound,
                  title: "JWT access tokens",
                  description: "Every request is signed and verified.",
                },
                {
                  icon: ShieldCheck,
                  title: "Refresh rotation",
                  description: "Sessions renew securely without exposing credentials.",
                },
                {
                  icon: Lock,
                  title: "Role-based access",
                  description: "Your data is scoped to your account and role.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                      <Icon size={13} />
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-[10.5px] leading-relaxed text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="btn btn-danger mt-5 w-full"
            >
              <Lock size={15} />
              Sign out of this device
            </button>
          </div>

          {/* Data */}
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                <Database size={17} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900">
                  Your data
                </h2>
                <p className="text-[11px] text-slate-500">Download a copy anytime</p>
              </div>
            </div>

            <p className="mt-4 text-[11.5px] leading-relaxed text-slate-500">
              Export every expense and income record associated with your account as a
              structured JSON file. The export includes dates, categories, amounts and
              notes.
            </p>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary mt-4 w-full"
            >
              {exporting ? <Spinner size={15} /> : <Download size={15} />}
              {exporting ? "Preparing export…" : "Export my data"}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck size={11} className="text-emerald-500" />
              Only you can access this download
            </p>
          </div>

          {/* About */}
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-amber-50/40 p-5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-teal-500">
              ExpenseTracker
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              A focused finance workspace for tracking expenses, income, budgets and
              reports — built with care for clarity and privacy.
            </p>
            <p className="mt-3 text-[10px] font-semibold text-slate-400">
              Version 2.0 · Finance workspace
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
        title="Sign out of this device?"
        message="Your saved preferences stay on this device, but you'll need to sign in again to access your records."
        confirmLabel="Sign out"
      />
    </div>
  );
};

export default Settings;
