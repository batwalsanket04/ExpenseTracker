import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock,
  CreditCard,
  Plus,
  ReceiptText,
  PiggyBank,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../Context/storeContext";
import AdminPanel from "./AdminPanel";
import {
  EmptyState,
  PageHeader,
  PageLoader,
  ProgressBar,
  SectionTitle,
  StatCard,
} from "../../components/ui";
import { getCategoryMeta } from "../../utils/categoryMeta";
import { formatDate, formatMoney, todayISO } from "../../utils/format";
import { loadPreferences } from "../../utils/preferences";
import { toast } from "react-toastify";
import BudgetAlerts from "../../components/BudgetAlerts";

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const transactionDateKey = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.slice(0, 10)) && !raw.includes("T")) {
    return raw.slice(0, 10);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : toDateKey(date);
};

const fetchAllExpenses = async () => {
  const limit = 100;
  let page = 1;
  let rows = [];

  while (true) {
    const response = await api.get("/expense/user", { params: { page, limit } });
    const data = response.data?.data;
    if (!Array.isArray(data)) break;

    rows = rows.concat(data);
    const totalPages = Number(response.data?.pagination?.totalPages || 1);
    if (page >= totalPages || data.length === 0) break;
    page += 1;
  }

  return rows;
};

const PERIOD_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

/**
 * Check whether a transaction date falls inside the selected period.
 */
const withinPeriod = (dateValue, period) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();

  switch (period) {
    case "today":
      return toDateKey(date) === toDateKey(now);
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      return date >= weekStart && date <= now;
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= monthStart && date <= now;
    }
    case "year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return date >= yearStart && date <= now;
    }
    case "all":
    default:
      return true;
  }
};

const UserOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("month");
  const [preferences] = useState(loadPreferences);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const [expRes, creditRes] = await Promise.all([
        fetchAllExpenses(),
        api.get("/credit/user"),
      ]);

      setExpenses(Array.isArray(expRes) ? expRes : []);
      setCredits(
        creditRes.data && Array.isArray(creditRes.data.data)
          ? creditRes.data.data
          : []
      );
    } catch (error) {
      console.log("Dashboard error:", error);
      if (!isRefresh) toast.error("Could not load your dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => fetchData(true);

  // Auto-refresh when the tab/window regains focus so newly added
  // transactions show up without a hard reload.
  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const handleChange = () => refresh();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("transactions:changed", handleChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("transactions:changed", handleChange);
    };
  }, []);

  const now = new Date();
  const todayKey = toDateKey(now);

  // Dynamically filter data by the selected period.
  const filteredExpenses = useMemo(
    () => expenses.filter((item) => withinPeriod(item.date, period)),
    [expenses, period]
  );
  const filteredCredits = useMemo(
    () => credits.filter((item) => withinPeriod(item.date, period)),
    [credits, period]
  );

  const totalExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const totalCredit = filteredCredits.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const netBalance = totalCredit - totalExpense;

  const todayExpense = expenses
    .filter((item) => transactionDateKey(item.date) === todayKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthExpenses = expenses.filter((item) => {
    const date = new Date(item.date);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= new Date(now.getFullYear(), now.getMonth(), 1) &&
      date <= now
    );
  });
  const monthCredits = credits.filter((item) => {
    const date = new Date(item.date);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= new Date(now.getFullYear(), now.getMonth(), 1) &&
      date <= now
    );
  });
  const monthExpense = monthExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const monthIncome = monthCredits.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const recentTransactions = [
    ...filteredExpenses.map((item) => ({ ...item, type: "Expense" })),
    ...filteredCredits.map((item) => ({ ...item, type: "Income" })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const weeklyDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      amount: 0,
    };
  });

  // The "Last 7 days" chart always shows the trailing 7 days regardless of the
  // period selector, so it never goes empty just because "This month" is picked.
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weeklyExpenses = expenses.filter((item) => {
    const date = new Date(item.date);
    return !Number.isNaN(date.getTime()) && date >= weekStart && date <= now;
  });

  weeklyExpenses.forEach((item) => {
    const key = transactionDateKey(item.date);
    const day = weeklyDays.find((entry) => entry.key === key);
    if (day) day.amount += Number(item.amount || 0);
  });

  const weeklyMax = Math.max(...weeklyDays.map((day) => day.amount), 1);
  const weeklyTotal = weeklyDays.reduce((sum, day) => sum + day.amount, 0);

  const categoryTotals = filteredExpenses.reduce((accumulator, item) => {
    const category = item.category || "Other";
    accumulator[category] = (accumulator[category] || 0) + Number(item.amount || 0);
    return accumulator;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "there").split(" ")[0];

  const quickActions = [
    {
      label: "Add expense",
      description: "Record money going out",
      to: "/dashboard/add-expense",
      icon: ArrowDownRight,
      className: "bg-rose-50 text-rose-600",
    },
    {
      label: "Add income",
      description: "Record money coming in",
      to: "/dashboard/add-expense",
      icon: ArrowUpRight,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Review budgets",
      description: "Check your category limits",
      to: "/dashboard/budgets",
      icon: PiggyBank,
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "Open reports",
      description: "Explore spending trends",
      to: "/dashboard/reports",
      icon: BarChart3,
      className: "bg-teal-50 text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}, ${firstName}`}
        subtitle="Here's a clear view of your money — balance, recent activity and where your spending is going."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="field text-xs border border-slate-200 bg-white px-2 py-1.5 rounded-lg shadow-sm focus:ring-1 focus:ring-teal-500"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="btn btn-secondary btn-sm disabled:opacity-60 disabled:pointer-events-none"
              title="Refresh"
            >
              {refreshing ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <Link to="/dashboard/reports" className="btn btn-secondary btn-sm">
              <BarChart3 size={14} className="text-teal-500" />
              Reports
            </Link>
            <Link to="/dashboard/add-expense" className="btn btn-primary btn-sm">
              <Plus size={14} strokeWidth={2.5} />
              Add
            </Link>
          </div>
        }
      />

      <BudgetAlerts autoToast />

      {/* Balance hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#102a25] p-6 text-white shadow-2xl shadow-teal-950/20 sm:p-7">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.35]" />
        </div>

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex max-w-md flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              Available balance
            </div>
            <p className="mt-3 font-display text-[36px] font-extrabold leading-none tracking-tight sm:text-[42px]">
              {formatMoney(netBalance)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Across {expenses.length + credits.length} recorded transactions
            </p>

            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Total income
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                  <TrendingUp size={14} />
                  {formatMoney(totalCredit)}
                </p>
              </div>
              <div className="border-l border-white/10 pl-6">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Total expenses
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-rose-300">
                  <TrendingDown size={14} />
                  {formatMoney(totalExpense)}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link to="/dashboard/add-expense" className="btn btn-sm bg-white text-slate-900 hover:bg-teal-50">
                <Plus size={15} strokeWidth={2.5} />
                Add expense
              </Link>
              <Link
                to="/dashboard/show-expense"
                className="btn btn-sm border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
              >
                View activity
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 backdrop-blur-sm lg:max-w-[420px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sparkles size={14} className="text-teal-300" />
                Last 7 days
              </div>
              <span className="text-xs font-bold text-white">{formatMoney(weeklyTotal)}</span>
            </div>

            <div className="mt-5 flex h-28 items-end gap-1.5 sm:gap-2.5">
              {weeklyDays.map((day) => (
                <div key={day.key} className="group flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-teal-500/60 via-teal-400/80 to-teal-300 transition-all duration-300 group-hover:from-teal-400 group-hover:to-teal-200"
                    style={{
                      height: `${Math.max(7, (day.amount / weeklyMax) * 100)}%`,
                    }}
                    title={`${day.label}: ${formatMoney(day.amount)}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-1.5 sm:gap-2.5">
              {weeklyDays.map((day) => (
                <span
                  key={day.key}
                  className="flex-1 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {day.label.slice(0, 1)}
                </span>
              ))}
            </div>

            <p className="mt-4 border-t border-white/[0.08] pt-3 text-[10.5px] text-slate-400">
              Daily spending trend. Peak day:{" "}
              <span className="font-semibold text-slate-200">
                {formatMoney(weeklyMax === 1 && weeklyTotal === 0 ? 0 : weeklyMax)}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          preferences.monthlySummary ? "xl:grid-cols-4" : "xl:grid-cols-2"
        }`}
      >
        <StatCard
          label="Today's spending"
          value={formatMoney(todayExpense)}
          icon={Clock}
          tone="rose"
          hint="Expenses recorded today"
        />
        <StatCard
          label="This month"
          value={formatMoney(monthExpense)}
          icon={CreditCard}
          tone="indigo"
          hint={`${monthExpenses.length} expense entries`}
        />
        {preferences.monthlySummary && (
          <>
            <StatCard
              label="Monthly income"
              value={formatMoney(monthIncome)}
              icon={TrendingUp}
              tone="emerald"
              hint={`${monthCredits.length} income entries`}
            />
            <StatCard
              label="Net this month"
              value={formatMoney(monthIncome - monthExpense)}
              icon={Wallet}
              tone={monthIncome - monthExpense >= 0 ? "sky" : "amber"}
              hint="Income minus expenses"
            />
          </>
        )}
      </section>

      {/* Activity + quick actions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="surface xl:col-span-8">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <SectionTitle
              icon={Clock}
              title="Recent transactions"
              subtitle="Your latest money movement"
              action={
                <Link
                  to="/dashboard/show-expense"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              }
            />
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No transactions yet"
              description="Add your first expense or income entry to see it appear here."
              action={
                <Link to="/dashboard/add-expense" className="btn btn-primary btn-sm">
                  <Plus size={15} />
                  Add transaction
                </Link>
              }
            />
          ) : (
            <div className="mt-4 divide-y divide-slate-100 px-3 pb-2 sm:px-4">
              {recentTransactions.map((transaction) => {
                const isExpense = transaction.type === "Expense";
                const meta = isExpense ? getCategoryMeta(transaction.category) : null;
                const CategoryIcon = meta?.icon || (isExpense ? ReceiptText : PiggyBank);

                return (
                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50/80 sm:px-3"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isExpense
                          ? meta?.iconBox || "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                      }`}
                    >
                      <CategoryIcon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {isExpense ? transaction.title : transaction.source}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {isExpense ? transaction.category || "Other" : transaction.method || "Income"} ·{" "}
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          isExpense ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {isExpense ? "−" : "+"}
                        {formatMoney(transaction.amount)}
                      </p>
                      <span
                        className={`mt-0.5 inline-block text-[9.5px] font-bold uppercase tracking-wide ${
                          isExpense ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="surface p-5 sm:p-6">
            <SectionTitle icon={Sparkles} title="Quick actions" subtitle="Jump straight in" />
            <div className="mt-4 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.to)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left transition hover:border-slate-100 hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${action.className}`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-slate-800">
                        {action.label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {action.description}
                      </span>
                    </span>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <SectionTitle
              icon={BarChart3}
              title="Spending by category"
              subtitle="This month"
              action={
                <Link
                  to="/dashboard/reports"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Details
                </Link>
              }
            />

            {topCategories.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-500">No spending recorded this month.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {topCategories.map((entry) => {
                  const meta = getCategoryMeta(entry.category);
                  const CategoryIcon = meta.icon;
                  const share = monthExpense > 0 ? (entry.amount / monthExpense) * 100 : 0;

                  return (
                    <div key={entry.category}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-md ${meta.iconBox}`}>
                            <CategoryIcon size={11} />
                          </span>
                          {entry.category}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {formatMoney(entry.amount)}
                        </span>
                      </div>
                      <ProgressBar
                        value={share}
                        tone={
                          entry.category === "Food"
                            ? "amber"
                            : entry.category === "Shopping"
                            ? "rose"
                            : entry.category === "Bills"
                            ? "violet"
                            : "sky"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const Overview = () => {
  const { role } = useAuth();

  if (role === "admin") {
    return <AdminPanel />;
  }

  return <UserOverview />;
};

export default Overview;
