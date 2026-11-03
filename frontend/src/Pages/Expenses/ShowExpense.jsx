import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Layers3,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import EditExpense from "./EditExpenses";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  SearchInput,
  StatCard,
} from "../../components/ui";
import { getCategoryMeta } from "../../utils/categoryMeta";
import { formatDate, formatMoney } from "../../utils/format";

const ShowExpense = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get("/expense/user");
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log("Fetch expenses error:", error);
      toast.error("Could not load your expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(data.map((item) => item.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [data]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = data.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.note || "").toLowerCase().includes(query) ||
        String(item.category || "").toLowerCase().includes(query);
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    });

    return rows.sort((a, b) => {
      if (sort === "oldest") return new Date(a.date) - new Date(b.date);
      if (sort === "highest") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sort === "lowest") return Number(a.amount || 0) - Number(b.amount || 0);
      return new Date(b.date) - new Date(a.date);
    });
  }, [data, search, category, sort]);

  const totalExpense = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filteredTotal = filtered.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const averageExpense = data.length > 0 ? totalExpense / data.length : 0;

  const topCategory = useMemo(() => {
    const totals = data.reduce((accumulator, item) => {
      const key = item.category || "Other";
      accumulator[key] = (accumulator[key] || 0) + Number(item.amount || 0);
      return accumulator;
    }, {});
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? { category: entries[0][0], amount: entries[0][1] } : null;
  }, [data]);

  const handleUpdate = (updated) => {
    setData((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/expense/${deleteTarget.id}`);
      setData((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success(response.data?.message || "Expense deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.log("Delete expense error:", error);
      toast.error(error.response?.data?.message || "Could not delete the expense");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("newest");
  };

  const hasFilters = search.trim() || category !== "All";

  if (loading) return <PageLoader label="Loading your expenses…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Expense history"
        title="Expenses"
        subtitle="Review, search and manage every expense you've recorded — all in one place."
        actions={
          <Link to="/dashboard/add-expense" className="btn btn-primary">
            <Plus size={16} strokeWidth={2.5} />
            Add expense
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total expenses"
          value={formatMoney(totalExpense)}
          icon={TrendingDown}
          tone="rose"
          hint="Across all recorded entries"
        />
        <StatCard
          label="Transactions"
          value={data.length}
          icon={Layers3}
          tone="indigo"
          hint="Expense entries in your history"
        />
        <StatCard
          label="Average expense"
          value={formatMoney(averageExpense)}
          icon={ReceiptText}
          tone="violet"
          hint="Average value per expense"
        />
        <StatCard
          label="Top category"
          value={topCategory?.category || "—"}
          icon={CalendarDays}
          tone="amber"
          hint={topCategory ? formatMoney(topCategory.amount) + " spent" : "No data yet"}
        />
      </section>

      {/* Toolbar */}
      <div className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, note or category…"
          className="flex-1"
        />

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="field h-[42px] py-0 sm:w-[160px]"
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="field h-[42px] py-0 sm:w-[150px]"
            aria-label="Sort expenses"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-ghost btn-sm h-[42px] text-slate-500"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">
              {hasFilters ? "Filtered expenses" : "All expenses"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              {hasFilters ? ` · ${formatMoney(filteredTotal)}` : ""}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 ring-1 ring-rose-100">
            <TrendingDown size={11} />
            Spending
          </span>
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No expenses recorded yet"
            description="Your expense history will appear here as soon as you add your first entry."
            action={
              <Link to="/dashboard/add-expense" className="btn btn-primary btn-sm">
                <Plus size={15} />
                Add your first expense
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching expenses"
            description="Try a different search term or clear the filters to see everything."
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table-shell min-w-[720px]">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const meta = getCategoryMeta(item.category);
                    const CategoryIcon = meta.icon;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBox}`}
                            >
                              <CategoryIcon size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-slate-800">
                                {item.title}
                              </p>
                              {item.note && (
                                <p className="max-w-[280px] truncate text-[11px] text-slate-400">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ring-1 ${meta.iconBox}`}>
                            {item.category || "Other"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-xs text-slate-500">
                          {formatDate(item.date)}
                        </td>
                        <td className="whitespace-nowrap text-right text-[13px] font-bold text-rose-600">
                          −{formatMoney(item.amount)}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditTarget(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600"
                              title="Edit expense"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete expense"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((item) => {
                const meta = getCategoryMeta(item.category);
                const CategoryIcon = meta.icon;
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBox}`}
                      >
                        <CategoryIcon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.title}
                          </p>
                          <p className="whitespace-nowrap text-sm font-bold text-rose-600">
                            −{formatMoney(item.amount)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.category || "Other"} · {formatDate(item.date)}
                        </p>
                        {item.note && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(item)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
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
          </>
        )}
      </div>

      <EditExpense
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        expense={editTarget || {}}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this expense?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” (${formatMoney(deleteTarget.amount)}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete expense"
      />
    </div>
  );
};

export default ShowExpense;
