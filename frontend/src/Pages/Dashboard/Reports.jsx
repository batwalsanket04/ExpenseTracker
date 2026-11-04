import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Download,
  PiggyBank,
  PieChart,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import {
  EmptyState,
  PageHeader,
  PageLoader,
  SectionTitle,
  StatCard,
} from "../../components/ui";
import { getCategoryMeta, CATEGORY_OPTIONS } from "../../utils/categoryMeta";
import { downloadCsv } from "../../utils/download";
import { formatDate, formatMoney, todayISO } from "../../utils/format";

const Reports = () => {
  const [expenses, setExpenses] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [expenseResponse, creditResponse] = await Promise.all([
          api.get("/expense/user"),
          api.get("/credit/user"),
        ]);

        if (!active) return;

        // Backend wraps the expense list in { data: rows, pagination }, so read
        // the nested array (same shape as the credit response) to keep reports dynamic.
        setExpenses(
          expenseResponse.data && Array.isArray(expenseResponse.data.data)
            ? expenseResponse.data.data
            : []
        );
        setCredits(
          creditResponse.data && Array.isArray(creditResponse.data.data)
            ? creditResponse.data.data
            : []
        );
      } catch (error) {
        console.log("Fetch reports error:", error);
        toast.error("Could not load your reports");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCredit = credits.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netBalance = totalCredit - totalExpense;
  const savingsRate = totalCredit > 0 ? (netBalance / totalCredit) * 100 : 0;

  const categoryData = useMemo(() => {
    const allowed = new Set(CATEGORY_OPTIONS);
    const totals = expenses.reduce((accumulator, item) => {
      // Normalize: only the predefined categories show in reports; everything
      // else (e.g. legacy seed data like Transport/Utilities/Fuel/Groceries)
      // is grouped under "Other" so no unnecessary categories appear.
      const category = allowed.has(item.category) ? item.category : "Other";
      accumulator[category] = (accumulator[category] || 0) + Number(item.amount || 0);
      return accumulator;
    }, {});

    return CATEGORY_OPTIONS.map((category) => ({
      category,
      amount: totals[category] || 0,
      percentage: totalExpense > 0 ? ((totals[category] || 0) / totalExpense) * 100 : 0,
      meta: getCategoryMeta(category),
    }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpense]);

  const topCategory = categoryData[0] || null;

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        expense: 0,
        income: 0,
      };
    });

    expenses.forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const month = months.find((entry) => entry.key === key);
      if (month) month.expense += Number(item.amount || 0);
    });

    credits.forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const month = months.find((entry) => entry.key === key);
      if (month) month.income += Number(item.amount || 0);
    });

    const max = Math.max(
      ...months.flatMap((month) => [month.expense, month.income]),
      1
    );

    return { months, max };
  }, [expenses, credits]);

  const recentTransactions = useMemo(
    () =>
      [
        ...expenses.map((item) => ({ ...item, type: "Expense" })),
        ...credits.map((item) => ({ ...item, type: "Income" })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8),
    [expenses, credits]
  );

  const donutGradient = useMemo(() => {
    if (categoryData.length === 0) return "conic-gradient(#e2e8f0 0 100%)";

    let cursor = 0;
    const stops = categoryData.map((item) => {
      const start = cursor;
      cursor += item.percentage;
      return `${item.meta.hex} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryData]);

  const handleExport = () => {
    const rows = [
      ["Date", "Type", "Title", "Category / Method", "Amount (INR)"],
      ...recentTransactions.map((item) => [
        item.date?.slice(0, 10) || "",
        item.type,
        item.type === "Expense" ? item.title : item.source,
        item.type === "Expense" ? item.category || "Other" : item.method || "Other",
        item.amount,
      ]),
    ];

    if (rows.length <= 1) {
      toast.info("There are no transactions to export yet.");
      return;
    }

    downloadCsv(`expense-tracker-report-${todayISO()}.csv`, rows.slice(1));
    toast.success("Report exported as CSV");
  };

  if (loading) return <PageLoader label="Building your reports…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        subtitle="Understand where your money goes with category breakdowns and a six-month cash flow view."
        actions={
          <button type="button" onClick={handleExport} className="btn btn-secondary">
            <Download size={16} className="text-teal-500" />
            Export CSV
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total expenses"
          value={formatMoney(totalExpense)}
          icon={TrendingDown}
          tone="rose"
          hint={`${expenses.length} expense transactions`}
        />
        <StatCard
          label="Total income"
          value={formatMoney(totalCredit)}
          icon={TrendingUp}
          tone="emerald"
          hint={`${credits.length} income transactions`}
        />
        <StatCard
          label="Net savings"
          value={formatMoney(netBalance)}
          icon={Wallet}
          tone={netBalance >= 0 ? "sky" : "amber"}
          hint="Income minus total expenses"
        />
        <StatCard
          label="Savings rate"
          value={`${totalCredit > 0 ? Math.max(0, savingsRate).toFixed(1) : "0.0"}%`}
          icon={PiggyBank}
          tone="indigo"
          hint="Share of income retained"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Category breakdown */}
        <div className="surface p-5 sm:p-6 xl:col-span-5">
          <SectionTitle
            icon={PieChart}
            title="Spending by category"
            subtitle="All recorded expenses"
          />

          {categoryData.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No spending data"
              description="Add expenses with categories to unlock the category breakdown."
              className="py-10"
            />
          ) : (
            <>
              <div className="mt-7 flex justify-center">
                <div className="relative h-44 w-44">
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: donutGradient }}
                  />
                  <div className="absolute inset-[20px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Total spent
                    </p>
                    <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-900">
                      {formatMoney(totalExpense)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {expenses.length} transactions
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {categoryData.map((item) => {
                  const Icon = item.meta.icon;
                  return (
                    <div key={item.category} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.meta.hex }} />
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-slate-700">
                        <Icon size={13} className="text-slate-400" />
                        <span className="truncate">{item.category}</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="w-20 text-right text-xs font-bold text-slate-800">
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Monthly trend */}
        <div className="surface p-5 sm:p-6 xl:col-span-7">
          <SectionTitle
            icon={BarChart3}
            title="Cash flow"
            subtitle="Last six months"
            action={
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Expenses
                </span>
              </div>
            }
          />

          <div className="mt-6 flex h-60 items-end gap-3 sm:gap-4">
            {monthlyTrend.months.map((month) => {
              const incomeHeight = Math.max(4, (month.income / monthlyTrend.max) * 100);
              const expenseHeight = Math.max(4, (month.expense / monthlyTrend.max) * 100);

              return (
                <div key={month.key} className="flex h-full flex-1 flex-col justify-end">
                  <div className="flex h-full items-end justify-center gap-1 sm:gap-1.5">
                    <div
                      className="group relative w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500 hover:from-emerald-600"
                      style={{ height: `${incomeHeight}%` }}
                      title={`${month.label} income: ${formatMoney(month.income)}`}
                    >
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[9px] font-semibold text-white group-hover:block">
                        {formatMoney(month.income)}
                      </span>
                    </div>
                    <div
                      className="group relative w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-rose-500 to-rose-400 transition-all duration-500 hover:from-rose-600"
                      style={{ height: `${expenseHeight}%` }}
                      title={`${month.label} expenses: ${formatMoney(month.expense)}`}
                    >
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[9px] font-semibold text-white group-hover:block">
                        {formatMoney(month.expense)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {month.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <div className="rounded-xl bg-emerald-50/60 p-3.5 ring-1 ring-emerald-100/60">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-emerald-600/80">
                Income this month
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-700">
                {formatMoney(monthlyTrend.months[5]?.income || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-3.5 ring-1 ring-rose-100/60">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-rose-600/80">
                Expenses this month
              </p>
              <p className="mt-1 text-lg font-bold text-rose-700">
                {formatMoney(monthlyTrend.months[5]?.expense || 0)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Insight */}
        <div className="relative overflow-hidden rounded-3xl bg-[#102a25] p-6 text-white shadow-xl xl:col-span-4">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-teal-500/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
              <Sparkles size={13} />
              Top category
            </div>

            {topCategory ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
                    {React.createElement(topCategory.meta.icon, {
                      size: 22,
                      className: "text-teal-200",
                    })}
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold">{topCategory.category}</p>
                    <p className="text-xs text-slate-400">
                      {topCategory.percentage.toFixed(1)}% of all spending
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-display text-3xl font-extrabold tracking-tight">
                  {formatMoney(topCategory.amount)}
                </p>
                <p className="mt-2 max-w-xs text-[11.5px] leading-relaxed text-slate-400">
                  This is where most of your money goes. Review these expenses to spot
                  easy opportunities to save.
                </p>

                <Link
                  to="/dashboard/show-expense"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 transition hover:text-teal-200"
                >
                  Review expenses
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <p className="mt-5 text-xs text-slate-400">
                Add some expenses and your top spending category will appear here.
              </p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="surface xl:col-span-8">
          <div className="p-5 pb-2 sm:p-6 sm:pb-2">
            <SectionTitle
              icon={Clock}
              title="Recent transactions"
              subtitle="Latest activity across expenses and income"
              action={
                <Link
                  to="/dashboard/show-expense"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  View all
                </Link>
              }
            />
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Nothing to report yet"
              description="Add expenses and income entries to populate your reports."
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
              {recentTransactions.map((item) => {
                const isExpense = item.type === "Expense";
                const meta = isExpense ? getCategoryMeta(item.category) : null;
                const Icon = isExpense
                  ? meta.icon
                  : PiggyBank;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50/80 sm:px-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isExpense
                          ? meta.iconBox
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {isExpense ? item.title : item.source}
                      </p>
                      <p className="text-[10.5px] text-slate-500">
                        {isExpense ? item.category || "Other" : item.method || "Income"} ·{" "}
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <span
                      className={`whitespace-nowrap text-[13px] font-bold ${
                        isExpense ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isExpense ? "−" : "+"}
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
