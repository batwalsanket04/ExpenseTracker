import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  KeyRound,
  Layout,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  Shield,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { useAuth } from "../../Context/storeContext";
import {
  Avatar,
  Badge,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  SearchInput,
  SectionTitle,
  Spinner,
  StatCard,
} from "../../components/ui";
import { getCategoryMeta } from "../../utils/categoryMeta";
import { downloadCsv } from "../../utils/download";
import { formatDate, formatDateTime, formatMoney, todayISO } from "../../utils/format";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "transactions", label: "Transactions", icon: List },
  { key: "categories", label: "Categories", icon: Layout },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "audit", label: "Audit logs", icon: FileText },
  { key: "security", label: "Security", icon: Shield },
];

const buildTransactionRows = (expenses, credits, userMap) =>
  [
    ...expenses.map((item) => ({
      id: `expense-${item.id}`,
      type: "Expense",
      title: item.title,
      category: item.category || "Other",
      date: item.date,
      amount: Number(item.amount || 0),
      note: item.note,
      userName: userMap[item.userId] || "Unknown user",
      userId: item.userId,
    })),
    ...credits.map((item) => ({
      id: `income-${item.id}`,
      type: "Income",
      title: item.source,
      category: item.method || "Other",
      date: item.date,
      amount: Number(item.amount || 0),
      note: item.note,
      userName: userMap[item.userId] || "Unknown user",
      userId: item.userId,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

const AdminPanel = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allUsers, setAllUsers] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allCredits, setAllCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [userResponse, expenseResponse, creditResponse] = await Promise.all([
        api.get("/user"),
        api.get("/expense/user"),
        api.get("/credit/user"),
      ]);

      setAllUsers(userResponse.data.users || []);
      setAllAdmins(userResponse.data.admins || []);
      setAllExpenses(Array.isArray(expenseResponse.data) ? expenseResponse.data : []);
      setAllCredits(
        creditResponse.data && Array.isArray(creditResponse.data.data)
          ? creditResponse.data.data
          : []
      );
    } catch (error) {
      console.log("Admin panel error:", error);
      toast.error("Could not load platform data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    [...allUsers, ...allAdmins].forEach((entry) => {
      map[entry.id] = entry.name;
    });
    return map;
  }, [allUsers, allAdmins]);

  const transactionRows = useMemo(
    () => buildTransactionRows(allExpenses, allCredits, userMap),
    [allExpenses, allCredits, userMap]
  );

  const stats = useMemo(() => {
    const totalExpense = allExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const totalCredit = allCredits.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      totalUsers: allUsers.length,
      totalAdmins: allAdmins.length,
      totalExpense,
      totalCredit,
      totalTransactions: allExpenses.length + allCredits.length,
      expenseCount: allExpenses.length,
      creditCount: allCredits.length,
      netFlow: totalCredit - totalExpense,
    };
  }, [allUsers, allAdmins, allExpenses, allCredits]);

  const categoryData = useMemo(() => {
    const totals = allExpenses.reduce((accumulator, item) => {
      const category = item.category || "Other";
      if (!accumulator[category]) {
        accumulator[category] = { amount: 0, count: 0 };
      }
      accumulator[category].amount += Number(item.amount || 0);
      accumulator[category].count += 1;
      return accumulator;
    }, {});

    return Object.entries(totals)
      .map(([category, value]) => ({
        category,
        amount: value.amount,
        count: value.count,
        percentage:
          stats.totalExpense > 0 ? (value.amount / stats.totalExpense) * 100 : 0,
        meta: getCategoryMeta(category),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allExpenses, stats.totalExpense]);

  const auditLogs = useMemo(
    () =>
      transactionRows.slice(0, 40).map((item) => ({
        ...item,
        action: item.type === "Expense" ? "Expense recorded" : "Income recorded",
        actor: item.userName,
        target: item.title,
      })),
    [transactionRows]
  );

  const recentActivity = transactionRows.slice(0, 8);

  const activeTab = tabs.some((tab) => tab.key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === "overview") next.delete("tab");
    else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      await api.delete(`/user/${userToDelete.id}`);
      toast.success("User removed from the platform");
      setUserToDelete(null);
      await fetchDashboardData();
    } catch (error) {
      console.log("Delete user error:", error);
      toast.error(error.response?.data?.message || "Could not delete this user");
    } finally {
      setDeletingUser(false);
    }
  };

  const exportTransactions = () => {
    if (transactionRows.length === 0) {
      toast.info("There are no transactions to export yet.");
      return;
    }

    downloadCsv(`expense-tracker-platform-transactions-${todayISO()}.csv`, [
      ["Date", "Type", "Title", "Category / Method", "User", "Amount (INR)"],
      ...transactionRows.map((item) => [
        item.date?.slice(0, 10) || "",
        item.type,
        item.title,
        item.category,
        item.userName,
        item.amount,
      ]),
    ]);
    toast.success("Platform transactions exported");
  };

  const exportUsers = () => {
    const rows = [
      ["Name", "Email", "Role", "Joined"],
      ...[
        ...allUsers.map((item) => ({ ...item, displayRole: "user" })),
        ...allAdmins.map((item) => ({ ...item, displayRole: "admin" })),
      ].map((item) => [
        item.name,
        item.email,
        item.displayRole,
        item.createdAt?.slice(0, 10) || "",
      ]),
    ];

    downloadCsv(`expense-tracker-users-${todayISO()}.csv`, rows);
    toast.success("User directory exported");
  };

  const exportAuditLogs = () => {
    if (auditLogs.length === 0) {
      toast.info("There are no audit records to export yet.");
      return;
    }

    downloadCsv(`expense-tracker-audit-logs-${todayISO()}.csv`, [
      ["Time", "Action", "Actor", "Target", "Amount (INR)", "Type"],
      ...auditLogs.map((log) => [
        log.date ? new Date(log.date).toISOString() : "",
        log.action,
        log.actor,
        log.target,
        log.amount,
        log.type,
      ]),
    ]);
    toast.success("Audit trail exported");
  };

  if (loading) return <PageLoader label="Loading the admin console…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Admin console"
        subtitle={`Signed in as ${user?.name || "Administrator"} · Platform-wide visibility of users, transactions and security.`}
        actions={
          <>
            <Badge tone="violet">
              <Shield size={11} />
              Admin access
            </Badge>
            <button type="button" onClick={exportTransactions} className="btn btn-secondary">
              <Download size={16} className="text-teal-500" />
              Export transactions
            </button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          tone="indigo"
          hint={`${stats.totalAdmins} administrator${stats.totalAdmins === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Transactions"
          value={stats.totalTransactions}
          icon={List}
          tone="violet"
          hint={`${stats.expenseCount} expenses · ${stats.creditCount} income`}
        />
        <StatCard
          label="Platform expenses"
          value={formatMoney(stats.totalExpense)}
          icon={TrendingDown}
          tone="rose"
          hint="Recorded across all users"
        />
        <StatCard
          label="Platform income"
          value={formatMoney(stats.totalCredit)}
          icon={TrendingUp}
          tone="emerald"
          hint="Recorded across all users"
        />
      </section>

      <div className="surface no-scrollbar flex gap-1 overflow-x-auto p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-teal-700 text-white shadow-lg shadow-teal-900/15"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <OverviewSection stats={stats} recentActivity={recentActivity} />
      )}
      {activeTab === "users" && (
        <UsersSection
          users={allUsers}
          admins={allAdmins}
          currentUserId={user?.id}
          onDelete={setUserToDelete}
          onExport={exportUsers}
        />
      )}
      {activeTab === "transactions" && (
        <TransactionsSection rows={transactionRows} onExport={exportTransactions} />
      )}
      {activeTab === "categories" && (
        <CategoriesSection categoryData={categoryData} totalExpense={stats.totalExpense} />
      )}
      {activeTab === "reports" && (
        <ReportsSection stats={stats} categoryData={categoryData} rows={transactionRows} />
      )}
      {activeTab === "audit" && (
        <AuditLogsSection logs={auditLogs} onExport={exportAuditLogs} />
      )}
      {activeTab === "security" && (
        <SecuritySection logs={auditLogs} onExportAudit={exportAuditLogs} />
      )}

      <ConfirmDialog
        open={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        loading={deletingUser}
        title="Remove this user?"
        message={
          userToDelete
            ? `${userToDelete.name} (${userToDelete.email}) will lose access to the platform. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove user"
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Overview                                                           */
/* ------------------------------------------------------------------ */
const OverviewSection = ({ stats, recentActivity }) => {
  const totalFlow = stats.totalExpense + stats.totalCredit;
  const expenseShare = totalFlow > 0 ? (stats.totalExpense / totalFlow) * 100 : 50;
  const incomeShare = 100 - expenseShare;
  const averageExpense =
    stats.expenseCount > 0 ? stats.totalExpense / stats.expenseCount : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="surface p-5 sm:p-6 xl:col-span-7">
          <SectionTitle
            icon={Activity}
            title="Platform cash flow"
            subtitle="Income versus expenses across every account"
          />

          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Total income
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold text-emerald-600">
                <TrendingUp size={17} />
                {formatMoney(stats.totalCredit)}
              </p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Total expenses
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold text-rose-600">
                <TrendingDown size={17} />
                {formatMoney(stats.totalExpense)}
              </p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Net flow
              </p>
              <p
                className={`mt-1 font-display text-2xl font-bold ${
                  stats.netFlow >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatMoney(stats.netFlow)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${incomeShare}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
              style={{ width: `${expenseShare}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Income {incomeShare.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Expenses {expenseShare.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="surface p-5 sm:p-6 xl:col-span-5">
          <SectionTitle
            icon={BarChart3}
            title="Platform pulse"
            subtitle="A quick health check"
          />

          <div className="mt-4 divide-y divide-slate-100">
            {[
              { label: "Registered users", value: stats.totalUsers },
              { label: "Administrators", value: stats.totalAdmins },
              { label: "Transaction entries", value: stats.totalTransactions },
              { label: "Average expense", value: formatMoney(averageExpense) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3">
                <span className="text-[11.5px] font-medium text-slate-500">{item.label}</span>
                <span className="text-[13px] font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-3">
            <p className="text-[10.5px] leading-relaxed text-teal-700">
              Use the tabs above to inspect users, transactions, categories, reports,
              audit activity and security settings.
            </p>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <SectionTitle
            icon={Clock}
            title="Recent platform activity"
            subtitle="Latest transactions from every account"
          />
        </div>

        {recentActivity.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No platform activity yet"
            description="Transactions from all users will appear here as they are recorded."
            className="py-10"
          />
        ) : (
          <div className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
            {recentActivity.map((item) => {
              const isExpense = item.type === "Expense";
              const meta = isExpense ? getCategoryMeta(item.category) : null;
              const Icon = isExpense ? meta.icon : Wallet;

              return (
                <div
                  key={item.id}
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
                      {item.title}
                    </p>
                    <p className="truncate text-[10.5px] text-slate-500">
                      {item.userName} · {item.category} · {formatDate(item.date)}
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
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */
const UsersSection = ({ users, admins, currentUserId, onDelete, onExport }) => {
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => [
      ...users.map((item) => ({ ...item, displayRole: "user" })),
      ...admins.map((item) => ({ ...item, displayRole: "admin" })),
    ],
    [users, admins]
  );

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(value) ||
        String(item.email || "").toLowerCase().includes(value) ||
        item.displayRole.includes(value)
    );
  }, [rows, query]);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={Users}
          title="Users & administrators"
          subtitle={`${users.length} users · ${admins.length} admins`}
        />
        <button type="button" onClick={onExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export directory
        </button>
      </div>

      <div className="border-b border-slate-100 p-4">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email or role…"
          className="max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching users"
          description="Try a different name, email address or role."
          className="py-10"
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table-shell min-w-[700px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={`${item.displayRole}-${item.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={item.name} size="sm" className="ring-transparent" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800">
                            <span className="truncate">{item.name}</span>
                            {item.id === currentUserId && (
                              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-teal-600">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={item.displayRole === "admin" ? "violet" : "indigo"}>
                        {item.displayRole === "admin" ? (
                          <Shield size={10} />
                        ) : (
                          <Users size={10} />
                        )}
                        {item.displayRole === "admin" ? "Admin" : "User"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {item.createdAt ? formatDate(item.createdAt) : "—"}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="text-right">
                      {item.id === currentUserId ? (
                        <span className="text-[10.5px] font-medium text-slate-400">
                          Current account
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map((item) => (
              <div key={`${item.displayRole}-${item.id}`} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={item.name} size="md" className="ring-transparent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{item.email}</p>
                      </div>
                      <Badge tone={item.displayRole === "admin" ? "violet" : "indigo"}>
                        {item.displayRole === "admin" ? "Admin" : "User"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[10.5px] text-slate-400">
                      {item.createdAt ? `Joined ${formatDate(item.createdAt)}` : "Active account"}
                    </p>
                  </div>
                </div>
                {item.id !== currentUserId && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={12} />
                      Remove user
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Transactions                                                       */
/* ------------------------------------------------------------------ */
const TransactionsSection = ({ rows, onExport }) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesQuery =
        !value ||
        String(item.title || "").toLowerCase().includes(value) ||
        String(item.userName || "").toLowerCase().includes(value) ||
        String(item.category || "").toLowerCase().includes(value);
      return matchesType && matchesQuery;
    });
  }, [rows, query, type]);

  const filteredTotal = filtered.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={List}
          title="Monitor transactions"
          subtitle={`${rows.length} total entries across the platform`}
        />
        <button type="button" onClick={onExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, user or category…"
          className="flex-1"
        />
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: "all", label: "All" },
            { key: "Expense", label: "Expenses" },
            { key: "Income", label: "Income" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setType(option.key)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                type === option.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
        <p className="text-[10.5px] font-medium text-slate-500">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} shown
        </p>
        <p className="text-[10.5px] font-bold text-slate-700">
          Total: {formatMoney(filteredTotal)}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={List}
          title="No transactions found"
          description="Try a different search term or change the transaction type filter."
          className="py-10"
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table-shell min-w-[820px]">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Transaction</th>
                  <th>User</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Badge tone={item.type === "Expense" ? "rose" : "emerald"}>
                        {item.type === "Expense" ? (
                          <TrendingDown size={10} />
                        ) : (
                          <TrendingUp size={10} />
                        )}
                        {item.type}
                      </Badge>
                    </td>
                    <td>
                      <p className="text-[13px] font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[10.5px] text-slate-500">{item.category}</p>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {item.userName}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(item.date)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right text-[13px] font-bold ${
                        item.type === "Expense" ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.type === "Expense" ? "−" : "+"}
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.slice(0, 50).map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={item.type === "Expense" ? "rose" : "emerald"}>
                        {item.type}
                      </Badge>
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[10.5px] text-slate-500">
                      {item.userName} · {item.category} · {formatDate(item.date)}
                    </p>
                  </div>
                  <p
                    className={`whitespace-nowrap text-[13px] font-bold ${
                      item.type === "Expense" ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {item.type === "Expense" ? "−" : "+"}
                    {formatMoney(item.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */
const CategoriesSection = ({ categoryData, totalExpense }) => (
  <div className="space-y-6">
    <div className="surface p-5 sm:p-6">
      <SectionTitle
        icon={Layout}
        title="Category insights"
        subtitle="How platform spending is distributed"
        action={
          <span className="badge bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <Wallet size={10} />
            {formatMoney(totalExpense)}
          </span>
        }
      />

      {categoryData.length === 0 ? (
        <EmptyState
          icon={Layout}
          title="No category data yet"
          description="As users add expenses with categories, distribution insights will appear here."
          className="py-10"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryData.map((item) => {
            const Icon = item.meta.icon;
            return (
              <div
                key={item.category}
                className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-teal-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.meta.iconBox}`}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{item.category}</p>
                      <p className="text-[10.5px] text-slate-500">
                        {item.count} transaction{item.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-400">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>

                <p className="mt-4 font-display text-xl font-bold text-slate-900">
                  {formatMoney(item.amount)}
                </p>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.meta.bar} transition-all duration-700`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Reports                                                            */
/* ------------------------------------------------------------------ */
const ReportsSection = ({ stats, categoryData, rows }) => {
  const monthly = useMemo(() => {
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

    rows.forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const month = months.find((entry) => entry.key === key);
      if (!month) return;
      if (item.type === "Expense") month.expense += item.amount;
      else month.income += item.amount;
    });

    const max = Math.max(...months.flatMap((month) => [month.expense, month.income]), 1);
    return { months, max };
  }, [rows]);

  const topTransactions = useMemo(
    () => [...rows].sort((a, b) => b.amount - a.amount).slice(0, 6),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Total expenses
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-rose-600">
            {formatMoney(stats.totalExpense)}
          </p>
          <p className="mt-1 text-[10.5px] text-slate-500">
            {stats.expenseCount} transactions
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Total income
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-emerald-600">
            {formatMoney(stats.totalCredit)}
          </p>
          <p className="mt-1 text-[10.5px] text-slate-500">
            {stats.creditCount} transactions
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Net platform flow
          </p>
          <p
            className={`mt-1.5 font-display text-xl font-bold ${
              stats.netFlow >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {formatMoney(stats.netFlow)}
          </p>
          <p className="mt-1 text-[10.5px] text-slate-500">Income minus expenses</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="surface p-5 sm:p-6 xl:col-span-7">
          <SectionTitle
            icon={BarChart3}
            title="Monthly platform trend"
            subtitle="Last six months of activity"
          />

          <div className="mt-6 flex h-56 items-end gap-3 sm:gap-4">
            {monthly.months.map((month) => (
              <div key={month.key} className="flex h-full flex-1 flex-col justify-end">
                <div className="flex h-full items-end justify-center gap-1 sm:gap-1.5">
                  <div
                    className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400"
                    style={{ height: `${Math.max(4, (month.income / monthly.max) * 100)}%` }}
                    title={`${month.label} income: ${formatMoney(month.income)}`}
                  />
                  <div
                    className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-rose-500 to-rose-400"
                    style={{ height: `${Math.max(4, (month.expense / monthly.max) * 100)}%` }}
                    title={`${month.label} expenses: ${formatMoney(month.expense)}`}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {month.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Expenses
            </span>
          </div>
        </div>

        <div className="surface p-5 sm:p-6 xl:col-span-5">
          <SectionTitle
            icon={Layout}
            title="Spending split"
            subtitle="By expense category"
          />

          {categoryData.length === 0 ? (
            <p className="mt-8 text-center text-xs text-slate-400">
              No category data available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {categoryData.map((item) => (
                <div key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-semibold text-slate-700">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.meta.bar}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <SectionTitle
            icon={Activity}
            title="Largest transactions"
            subtitle="Highest-value entries across the platform"
          />
        </div>

        {topTransactions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No transactions yet"
            description="Platform transactions will appear here once users start recording."
            className="py-10"
          />
        ) : (
          <div className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
            {topTransactions.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50/80 sm:px-3"
              >
                <Badge tone={item.type === "Expense" ? "rose" : "emerald"}>
                  {item.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="truncate text-[10.5px] text-slate-500">
                    {item.userName} · {formatDate(item.date)}
                  </p>
                </div>
                <p
                  className={`whitespace-nowrap text-[13px] font-bold ${
                    item.type === "Expense" ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {item.type === "Expense" ? "−" : "+"}
                  {formatMoney(item.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Audit logs                                                         */
/* ------------------------------------------------------------------ */
const AuditLogsSection = ({ logs, onExport }) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesType = type === "all" || log.type === type;
      const matchesQuery =
        !value ||
        String(log.action || "").toLowerCase().includes(value) ||
        String(log.actor || "").toLowerCase().includes(value) ||
        String(log.target || "").toLowerCase().includes(value);
      return matchesType && matchesQuery;
    });
  }, [logs, query, type]);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={FileText}
          title="Audit logs"
          subtitle="Derived from platform transaction activity"
        />
        <button type="button" onClick={onExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export trail
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search actions, actors or targets…"
          className="flex-1"
        />
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: "all", label: "All" },
            { key: "Expense", label: "Expenses" },
            { key: "Income", label: "Income" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setType(option.key)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                type === option.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit records found"
          description="Try a different search term or type filter."
          className="py-10"
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table-shell min-w-[820px]">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-[11px] text-slate-500">
                      {formatDateTime(log.date)}
                    </td>
                    <td className="whitespace-nowrap text-[13px] font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">{log.actor}</td>
                    <td className="max-w-[220px] truncate text-xs text-slate-600">
                      {log.target}
                    </td>
                    <td className="whitespace-nowrap text-right text-xs font-bold text-slate-700">
                      {formatMoney(log.amount)}
                    </td>
                    <td className="text-right">
                      <Badge tone={log.type === "Expense" ? "rose" : "emerald"}>
                        {log.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.slice(0, 50).map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">{log.action}</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      {log.actor} · {formatDateTime(log.date)}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-400">{log.target}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={log.type === "Expense" ? "rose" : "emerald"}>
                      {log.type}
                    </Badge>
                    <p className="mt-1 text-[11px] font-bold text-slate-700">
                      {formatMoney(log.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Security                                                           */
/* ------------------------------------------------------------------ */
const SecuritySection = ({ logs, onExportAudit }) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "—";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5 sm:p-6">
          <SectionTitle
            icon={ShieldCheck}
            title="Current session"
            subtitle="This device and account"
          />

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <Avatar name={displayName} size="lg" className="ring-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
              <p className="truncate text-[11px] text-slate-500">{displayEmail}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="violet">
                  <Shield size={10} />
                  Admin
                </Badge>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {[
              "Access tokens are signed and verified on every request.",
              "Refresh tokens rotate automatically when a session renews.",
              "Role-based authorisation limits admin routes to admins only.",
            ].map((line) => (
              <p key={line} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                {line}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="btn btn-danger mt-5 w-full"
          >
            <LogOut size={15} />
            Sign out of this device
          </button>
        </div>

        <div className="surface p-5 sm:p-6">
          <SectionTitle
            icon={KeyRound}
            title="Security controls"
            subtitle="How the platform protects accounts"
          />

          <div className="mt-5 space-y-3">
            {[
              {
                icon: KeyRound,
                title: "JWT authentication",
                description: "Short-lived access tokens with signed claims.",
              },
              {
                icon: Lock,
                title: "Hashed credentials",
                description: "Passwords are hashed with bcrypt before storage.",
              },
              {
                icon: ShieldCheck,
                title: "Role-based access",
                description: "Admin-only APIs are protected by middleware.",
              },
              {
                icon: Database,
                title: "Scoped data",
                description: "Users only access their own records and reports.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{item.title}</p>
                    <p className="text-[10.5px] leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5 sm:p-6">
          <SectionTitle
            icon={Users}
            title="Access management"
            subtitle="Review who has platform access"
          />
          <p className="mt-4 text-[11.5px] leading-relaxed text-slate-500">
            Inspect the user directory to review roles and remove accounts that should
            no longer have access. You cannot remove your own account.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to="/dashboard/admin?tab=users" className="btn btn-secondary flex-1">
              <Users size={15} />
              Review users
            </Link>
            <Link to="/dashboard/admin?tab=audit" className="btn btn-secondary flex-1">
              <FileText size={15} />
              View audit trail
            </Link>
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <SectionTitle
            icon={FileText}
            title="Audit & compliance"
            subtitle={`${logs.length} recent activity records`}
          />
          <p className="mt-4 text-[11.5px] leading-relaxed text-slate-500">
            Export a timestamped record of recent platform transaction activity for
            review or archiving. Exports include the actor, target, amount and type.
          </p>
          <button
            type="button"
            onClick={onExportAudit}
            className="btn btn-primary mt-4 w-full"
          >
            <Download size={15} />
            Export audit trail
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
        title="Sign out of the admin console?"
        message="You'll need to sign in again to access platform-wide data and controls."
        confirmLabel="Sign out"
      />
    </div>
  );
};

export default AdminPanel;
