import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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

const PAGE_LIMIT = 10;

const ShowExpense = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", pagination.limit);
      params.set("sort", sort);
      if (search.trim()) params.set("search", search.trim());
      if (category !== "All") params.set("category", category);
      if (minAmount.trim()) params.set("minAmount", minAmount);
      if (maxAmount.trim()) params.set("maxAmount", maxAmount);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await api.get(`/expense/user?${params.toString()}`);
      const body = response.data || {};
      const expenses = Array.isArray(body.data) ? body.data : [];
      setData(expenses);
      setPagination((prev) => ({
        ...prev,
        page,
        total: body.pagination?.total ?? 0,
        totalPages: body.pagination?.totalPages ?? 0,
      }));

      // Build category list for the filter dropdown from all known categories.
      // Categories come from the current page; refresh options as pages change.
      const pageCats = [
        ...new Set(expenses.map((item) => item.category).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b));
      setCategories((current) => {
        const merged = [...new Set([...current, ...pageCats])].sort((a, b) =>
          a.localeCompare(b)
        );
        return merged;
      });
    } catch (error) {
      console.log("Fetch expenses error:", error);
      toast.error("Could not load your expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, category, sort, minAmount, maxAmount, startDate, endDate, pagination.limit]);

  const totalExpense = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
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

  const hasFilters =
    search.trim() ||
    category !== "All" ||
    minAmount.trim() ||
    maxAmount.trim() ||
    startDate ||
    endDate;

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    fetchData(page);
  };

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
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
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
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setPagination({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 });
    fetchData(1);
  };

  if (loading) return <PageLoader label="Loading your expenses…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Expense history"
        title="Expenses"
        subtitle={
          hasFilters
            ? `Showing expenses matching your filters · ${pagination.total} total match${pagination.total === 1 ? "" : "es"}`
            : "Review, search and manage every expense you've recorded — all in one place."
        }
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
          hint="Sum of expenses on this page"
        />
        <StatCard
          label="Transactions"
          value={data.length}
          icon={Layers3}
          tone="indigo"
          hint="Expense entries on this page"
        />
        <StatCard
          label="Average expense"
          value={formatMoney(averageExpense)}
          icon={ReceiptText}
          tone="violet"
          hint="Average value per expense on this page"
        />
        <StatCard
          label="Total matching"
          value={pagination.total}
          icon={CalendarDays}
          tone="teal"
          hint="Expenses matching your filters across all pages"
        />
      </section>

      {/* Toolbar – stays in one line; scrolls horizontally on small screens */}
      <div className="surface p-4 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="min-w-[700px] flex items-center justify-between gap-4 flex-nowrap">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, note or category…"
            className="flex-1 lg:w-[260px] min-w-[200px]"
          />

          <div className="flex items-center gap-3 flex-nowrap">
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="field h-[42px] py-0 w-[170px] shrink-0"
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 flex-nowrap">
              <input
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(event) => setMinAmount(event.target.value)}
                placeholder="Min amount"
                className="field h-[42px] py-0 w-[120px] text-sm shrink-0"
                aria-label="Minimum amount"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(event) => setMaxAmount(event.target.value)}
                placeholder="Max amount"
                className="field h-[42px] py-0 w-[120px] text-sm shrink-0"
                aria-label="Maximum amount"
              />
            </div>

            <div className="flex items-center gap-2 flex-nowrap">
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="field h-[42px] py-0 w-[140px] text-sm shrink-0"
                aria-label="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="field h-[42px] py-0 w-[140px] text-sm shrink-0"
                aria-label="End date"
              />
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="field h-[42px] py-0 w-[150px] shrink-0"
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
                className="btn btn-ghost btn-sm h-[42px] text-slate-500 shrink-0"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">
              {hasFilters ? "Filtered expenses" : "All expenses"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {data.length} {data.length === 1 ? "entry" : "entries"} on this page
              {hasFilters ? ` · ${formatMoney(totalExpense)}` : ""}
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
                  {data.map((item) => {
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
              {data.map((item) => {
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

            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/60">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>
                    Page <strong>{pagination.page}</strong> of{" "}
                    <strong>{pagination.totalPages}</strong>
                  </span>
                  <span className="ml-3">
                    {pagination.total} total
                    {pagination.total === 1 ? " entry" : " entries"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary btn-sm h-[34px] px-3 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={12} />
                    Prev
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const show =
                      pagination.totalPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      Math.abs(pageNum - pagination.page) <= 1;
                    if (!show) return null;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-sm h-[34px] w-[34px] ${
                          pagination.page === pageNum
                            ? "bg-teal-700 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn btn-secondary btn-sm h-[34px] px-3 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
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
