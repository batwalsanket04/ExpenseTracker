import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Layers3,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import EditCredit from "./EditCredit";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  SearchInput,
  StatCard,
} from "../../components/ui";
import { formatDate, formatMoney } from "../../utils/format";

const ShowCredits = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("All");
  const [sort, setSort] = useState("newest");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get("/credit/user");
      setData(response.data && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.log("Fetch credits error:", error);
      toast.error("Could not load your income history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const methods = useMemo(
    () =>
      [...new Set(data.map((item) => item.method).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [data]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = data.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.source || "").toLowerCase().includes(query) ||
        String(item.note || "").toLowerCase().includes(query) ||
        String(item.method || "").toLowerCase().includes(query);
      const matchesMethod = method === "All" || item.method === method;
      return matchesSearch && matchesMethod;
    });

    return rows.sort((a, b) => {
      if (sort === "oldest") return new Date(a.date) - new Date(b.date);
      if (sort === "highest") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sort === "lowest") return Number(a.amount || 0) - Number(b.amount || 0);
      return new Date(b.date) - new Date(a.date);
    });
  }, [data, search, method, sort]);

  const totalIncome = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const averageIncome = data.length > 0 ? totalIncome / data.length : 0;

  const topMethod = useMemo(() => {
    const counts = data.reduce((accumulator, item) => {
      const key = item.method || "Other";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : "—";
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
      const response = await api.delete(`/credit/${deleteTarget.id}`);
      setData((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success(response.data?.message || "Income entry deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.log("Delete credit error:", error);
      toast.error(error.response?.data?.message || "Could not delete the income entry");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setMethod("All");
    setSort("newest");
  };

  const hasFilters = search.trim() || method !== "All";

  if (loading) return <PageLoader label="Loading your income history…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Income history"
        title="Income"
        subtitle="Track every source of money coming in and keep your net balance accurate."
        actions={
          <Link to="/dashboard/add-expense" className="btn btn-primary">
            <Plus size={16} strokeWidth={2.5} />
            Add income
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total income"
          value={formatMoney(totalIncome)}
          icon={TrendingUp}
          tone="emerald"
          hint="Across all recorded entries"
        />
        <StatCard
          label="Income entries"
          value={data.length}
          icon={Layers3}
          tone="indigo"
          hint="Entries in your history"
        />
        <StatCard
          label="Average income"
          value={formatMoney(averageIncome)}
          icon={Wallet}
          tone="sky"
          hint="Average value per entry"
        />
        <StatCard
          label="Top method"
          value={topMethod}
          icon={CreditCard}
          tone="violet"
          hint="Most frequently used"
        />
      </section>

      <div className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by source, method or note…"
          className="flex-1"
        />

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="field h-[42px] py-0 sm:w-[170px]"
            aria-label="Filter by payment method"
          >
            <option value="All">All methods</option>
            {methods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="field h-[42px] py-0 sm:w-[150px]"
            aria-label="Sort income entries"
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
              {hasFilters ? "Filtered income" : "All income"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-100">
            <TrendingUp size={11} />
            Income
          </span>
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No income recorded yet"
            description="Add salary, refunds or any money received to keep your balance complete."
            action={
              <Link to="/dashboard/add-expense" className="btn btn-primary btn-sm">
                <Plus size={15} />
                Add your first income
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching income entries"
            description="Try a different search term or clear the filters to see everything."
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table-shell min-w-[720px]">
                <thead>
                  <tr>
                    <th>Income</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                            <PiggyBank size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                              {item.source}
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
                        <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                          <CreditCard size={11} />
                          {item.method || "Other"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(item.date)}
                      </td>
                      <td className="whitespace-nowrap text-right text-[13px] font-bold text-emerald-600">
                        +{formatMoney(item.amount)}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditTarget(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600"
                            title="Edit income"
                            aria-label={`Edit ${item.source}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete income"
                            aria-label={`Delete ${item.source}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <PiggyBank size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.source}
                        </p>
                        <p className="whitespace-nowrap text-sm font-bold text-emerald-600">
                          +{formatMoney(item.amount)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.method || "Other"} · {formatDate(item.date)}
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
              ))}
            </div>
          </>
        )}
      </div>

      <EditCredit
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        credit={editTarget || {}}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this income entry?"
        message={
          deleteTarget
            ? `“${deleteTarget.source}” (${formatMoney(deleteTarget.amount)}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete entry"
      />
    </div>
  );
};

export default ShowCredits;
