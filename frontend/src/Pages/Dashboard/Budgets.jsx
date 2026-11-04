import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  IndianRupee,
  Layers3,
  Pencil,
  PieChart,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  PageLoader,
  ProgressBar,
  Spinner,
  StatCard,
} from "../../components/ui";
import { CATEGORY_OPTIONS, getCategoryMeta } from "../../utils/categoryMeta";
import { addDaysISO, formatDate, formatMoney, todayISO } from "../../utils/format";
import { loadPreferences } from "../../utils/preferences";
import BudgetAlerts from "../../components/BudgetAlerts";

const defaultDates = (period) => {
  const startDate = todayISO();
  const days = period === "weekly" ? 7 : period === "yearly" ? 365 : 30;
  return { startDate, endDate: addDaysISO(startDate, days) };
};

const emptyForm = {
  category: "Food",
  amount: "",
  period: "monthly",
  ...defaultDates("monthly"),
};

const getBudgetNumbers = (budget) => {
  const allocated = Number(budget.amount || 0);
  const spent = Number(budget.spent || 0);
  const calculatedPercentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const percentageValue =
    budget.percentage !== undefined && budget.percentage !== null
      ? Number(budget.percentage)
      : calculatedPercentage;
  const remaining =
    budget.remaining !== undefined && budget.remaining !== null
      ? Number(budget.remaining)
      : allocated - spent;

  return {
    allocated,
    spent,
    percentage: Math.max(0, percentageValue),
    remaining,
  };
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [preferences] = useState(loadPreferences);

  const fetchBudgets = async () => {
    try {
      const response = await api.get("/budget/");
      setBudgets(response.data.data || []);
    } catch (error) {
      console.log("Fetch budgets error:", error);
      toast.error("Could not load your budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePeriodChange = (event) => {
    const period = event.target.value;
    setForm((current) => ({ ...current, period, ...defaultDates(period) }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (budget) => {
    setEditingId(budget.id);
    setForm({
      category: budget.category || "Food",
      amount: budget.amount || "",
      period: budget.period || "monthly",
      startDate: budget.startDate?.slice(0, 10) || todayISO(),
      endDate: budget.endDate?.slice(0, 10) || addDaysISO(todayISO(), 30),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.category || !form.amount || Number(form.amount) <= 0) {
      toast.warning("Choose a category and enter a budget amount.");
      return;
    }

    if (!form.startDate || !form.endDate || new Date(form.endDate) < new Date(form.startDate)) {
      toast.warning("Please choose a valid date range.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/budget/${editingId}`, form);
        toast.success("Budget updated successfully");
      } else {
        await api.post("/budget/add", form);
        toast.success("Budget created successfully");
      }
      setIsModalOpen(false);
      await fetchBudgets();
    } catch (error) {
      console.log("Save budget error:", error);
      toast.error(error.response?.data?.message || "Could not save the budget");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/budget/${deleteTarget.id}`);
      setBudgets((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success("Budget deleted");
      setDeleteTarget(null);
    } catch (error) {
      console.log("Delete budget error:", error);
      toast.error(error.response?.data?.message || "Could not delete the budget");
    } finally {
      setDeleting(false);
    }
  };

  const totalAllocated = budgets.reduce(
    (sum, budget) => sum + getBudgetNumbers(budget).allocated,
    0
  );
  const totalSpent = budgets.reduce(
    (sum, budget) => sum + getBudgetNumbers(budget).spent,
    0
  );
  const totalRemaining = totalAllocated - totalSpent;
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  if (loading) return <PageLoader label="Loading your budgets…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Budgets"
        subtitle="Set category limits, track how much you've spent and know what's left before it's gone."
        actions={
          <button type="button" onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} strokeWidth={2.5} />
            New budget
          </button>
        }
      />

      <BudgetAlerts autoToast />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active budgets"
          value={budgets.length}
          icon={Target}
          tone="indigo"
          hint="Category limits you've set"
        />
        <StatCard
          label="Total allocated"
          value={formatMoney(totalAllocated)}
          icon={Wallet}
          tone="violet"
          hint="Across all active budgets"
        />
        <StatCard
          label="Total spent"
          value={formatMoney(totalSpent)}
          icon={TrendingDown}
          tone="rose"
          hint={`${overallPercentage.toFixed(0)}% of allocated funds`}
        />
        <StatCard
          label="Remaining"
          value={formatMoney(totalRemaining)}
          icon={PieChart}
          tone={totalRemaining >= 0 ? "emerald" : "amber"}
          hint={totalRemaining >= 0 ? "Still available to spend" : "You've exceeded your budgets"}
        />
      </section>

      {budgets.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Target}
            title="No budgets created yet"
            description="Create your first category budget to start tracking spending against a limit."
            action={
              <button type="button" onClick={openAddModal} className="btn btn-primary btn-sm">
                <Plus size={15} />
                Create your first budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const meta = getCategoryMeta(budget.category);
            const CategoryIcon = meta.icon;
            const { allocated, spent, percentage, remaining } = getBudgetNumbers(budget);
            const isOver = percentage >= 100;
            const isWarning = percentage >= 75 && percentage < 100;
            const tone = !preferences.budgetAlerts
              ? "indigo"
              : isOver
              ? "rose"
              : isWarning
              ? "amber"
              : "emerald";

            return (
              <div
                key={budget.id}
                className="surface surface-hover group relative overflow-hidden p-5"
              >
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl ${
                    !preferences.budgetAlerts
                      ? "bg-teal-200/60"
                      : isOver
                      ? "bg-rose-200/70"
                      : isWarning
                      ? "bg-amber-200/70"
                      : "bg-emerald-200/50"
                  }`}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconBox}`}
                    >
                      <CategoryIcon size={19} />
                    </span>
                    <div>
                      <h3 className="font-display text-[15px] font-bold text-slate-900">
                        {budget.category || "Other"}
                      </h3>
                      <p className="mt-0.5 text-[10.5px] capitalize text-slate-500">
                        {budget.period || "monthly"} budget
                      </p>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      !preferences.budgetAlerts
                        ? "bg-teal-50 text-teal-600 ring-1 ring-teal-100"
                        : isOver
                        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                        : isWarning
                        ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                        : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="relative mt-5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Spent
                      </p>
                      <p className="mt-1 font-display text-xl font-bold text-slate-900">
                        {formatMoney(spent)}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                          of {formatMoney(allocated)}
                        </span>
                      </p>
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        remaining < 0 ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      {remaining < 0 ? "Over by " : "Left "}
                      {formatMoney(Math.abs(remaining))}
                    </p>
                  </div>

                  <ProgressBar value={percentage} tone={tone} className="mt-3 h-2.5" />

                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={11} />
                      {budget.startDate ? formatDate(budget.startDate) : "—"} –{" "}
                      {budget.endDate ? formatDate(budget.endDate) : "—"}
                    </span>
                  </div>
                </div>

                <div className="relative mt-4 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 opacity-100 transition focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleEdit(budget)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(budget)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingId ? "Edit budget" : "Create a budget"}
        subtitle="Set a category limit and the period it applies to."
        icon={<Target size={18} />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget-category" className="label-field">
                Category
              </label>
              <div className="relative">
                <Layers3
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  id="budget-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="field field-icon h-[44px] py-0"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="budget-amount" className="label-field">
                Budget amount
              </label>
              <div className="relative">
                <IndianRupee
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="budget-amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  required
                  className="field field-icon h-[44px] py-0"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="budget-period" className="label-field">
              Period
            </label>
            <select
              id="budget-period"
              name="period"
              value={form.period}
              onChange={handlePeriodChange}
              className="field h-[44px] py-0"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget-start" className="label-field">
                Start date
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="budget-start"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="field field-icon h-[44px] py-0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget-end" className="label-field">
                End date
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="budget-end"
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="field field-icon h-[44px] py-0"
                />
              </div>
            </div>
          </div>

          <p className="rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-3 text-[11px] leading-relaxed text-teal-700">
            Spending is calculated automatically from expenses in this date range and
            category. You can adjust the dates at any time.
          </p>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner size={15} />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create budget"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this budget?"
        message={
          deleteTarget
            ? `The ${deleteTarget.category} budget of ${formatMoney(
                deleteTarget.amount
              )} will be removed. Your transactions will not be affected.`
            : ""
        }
        confirmLabel="Delete budget"
      />
    </div>
  );
};

export default Budgets;
