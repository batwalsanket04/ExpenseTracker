import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
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
  X,
  Bell,
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
import { getCategoryMeta, CATEGORY_OPTIONS } from "../../utils/categoryMeta";
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

  /* --- Notification preferences (admin) --- */
  const [notificationPrefs, setNotificationPrefs] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState({});

  const fetchNotificationPrefs = async () => {
    setLoadingPrefs(true);
    try {
      const res = await api.get("/notification-preferences/admin/all");
      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      setNotificationPrefs(rows);
    } catch (error) {
      console.log("Fetch admin notification preferences error:", error);
      toast.error("Could not load notification preferences");
    } finally {
      setLoadingPrefs(false);
    }
  };

  const toggleUserNotificationPref = async (userId, key, checked) => {
    setSavingPrefs((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/notification-preferences/admin/${userId}`, {
        [key]: checked,
      });
      toast.success("Notification preference updated");
      setNotificationPrefs((rows) =>
        rows.map((row) =>
          row.userId === userId
            ? { ...row, [key]: checked }
            : row
        )
      );
    } catch (error) {
      console.log("Update user notification preference error:", error);
      toast.error("Could not update notification preference");
      // Revert optimistic UI is handled by re-fetch on next mount; keep simple.
    } finally {
      setSavingPrefs((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [userResponse, expenseResponse, creditResponse] = await Promise.all([
        api.get("/user"),
        api.get("/expense/user"),
        api.get("/credit/user"),
      ]);

      setAllUsers(userResponse.data.users || []);
      setAllAdmins(userResponse.data.admins || []);
      // Backend wraps the expense list in { data: rows, pagination }
      setAllExpenses(
        expenseResponse.data && Array.isArray(expenseResponse.data.data)
          ? expenseResponse.data.data
          : []
      );
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
    fetchNotificationPrefs();
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
    const allowed = new Set(CATEGORY_OPTIONS);
    const totals = allExpenses.reduce((accumulator, item) => {
      // Normalize: only predefined categories show; legacy/unknown categories
      // (e.g. Transport, Utilities, Fuel, Groceries from seed data) are grouped
      // under "Other" so no unnecessary categories appear in reports.
      const category = allowed.has(item.category) ? item.category : "Other";
      if (!accumulator[category]) {
        accumulator[category] = { amount: 0, count: 0 };
      }
      accumulator[category].amount += Number(item.amount || 0);
      accumulator[category].count += 1;
      return accumulator;
    }, {});

    return CATEGORY_OPTIONS.map((category) => {
      const value = totals[category] || { amount: 0, count: 0 };
      return {
        category,
        amount: value.amount,
        count: value.count,
        percentage:
          stats.totalExpense > 0 ? (value.amount / stats.totalExpense) * 100 : 0,
        meta: getCategoryMeta(category),
      };
    })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [allExpenses, stats.totalExpense]);

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

  const exportAuditLogs = async () => {
    try {
      const logs = await fetchAllAuditLogs();
      if (logs.length === 0) {
        toast.info("There are no audit records to export yet.");
        return;
      }

      downloadCsv(`expense-tracker-audit-logs-${todayISO()}.csv`, [
        ["Time", "Action", "Actor", "Target", "Amount (INR)", "Type"],
        ...logs.map((log) => [
          log.createdAt ? new Date(log.createdAt).toISOString() : "",
          log.action,
          log.actor,
          log.target,
          log.amount,
          log.type,
        ]),
      ]);
      toast.success("Audit trail exported");
    } catch (error) {
      toast.error("Could not export audit trail");
    }
  };

  /**
   * Fetch every audit log record (all pages) for export.
   */
  const fetchAllAuditLogs = async () => {
    const all = [];
    let page = 1;
    const limit = 100;
    for (;;) {
      const params = new URLSearchParams({ page, limit });
      const res = await api.get(`/audit?${params.toString()}`);
      const body = res.data || {};
      const pageLogs = Array.isArray(body.data) ? body.data : [];
      all.push(...pageLogs);
      if (pageLogs.length < limit || page >= (body.pagination?.totalPages || 1)) break;
      page += 1;
    }
    return all;
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
          currentUserId={user?.id}
          onDelete={setUserToDelete}
          onExport={exportUsers}
        />
      )}
      {activeTab === "transactions" && (
        <TransactionsSection onExport={exportTransactions} />
      )}
      {activeTab === "categories" && (
        <CategoriesSection categoryData={categoryData} totalExpense={stats.totalExpense} />
      )}
      {activeTab === "reports" && (
        <ReportsSection stats={stats} categoryData={categoryData} rows={transactionRows} />
      )}
      {activeTab === "audit" && (
        <AuditLogsSection onExport={exportAuditLogs} />
      )}
      {activeTab === "security" && (
        <SecuritySection onExportAudit={exportAuditLogs} />
      )}

      {/* Admin: manage notification preferences for every user */}
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionTitle
            icon={Bell}
            title="User notification preferences"
            subtitle={
              notificationPrefs.length === 0
                ? "No preferences yet"
                : `Manage email, in-app, reminders and summary digests for ${notificationPrefs.length} user${notificationPrefs.length === 1 ? "" : "s"}.`
            }
          />
          <button
            type="button"
            onClick={fetchNotificationPrefs}
            disabled={loadingPrefs}
            className="btn btn-secondary btn-sm"
          >
            {loadingPrefs ? <Spinner size={14} /> : <Download size={14} />}
            Refresh
          </button>
        </div>

        {loadingPrefs ? (
          <PageLoader label="Loading notification preferences…" className="h-[300px]" />
        ) : notificationPrefs.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notification preferences yet"
            description="Preferences are created automatically when a user first opens their settings."
            className="py-10"
          />
        ) : (
          <div className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
            {notificationPrefs.map((row) => {
              const user = row.user || {};
              return (
                <div
                  key={row.userId}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50/80 sm:px-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.name || "User"} size="sm" className="ring-transparent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {user.name || "Unknown user"}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {user.email || "—"} ·{" "}
                        <span className="capitalize">{user.role || "user"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3 ml-auto">
                    {[
                      { key: "emailNotifications", label: "Email" },
                      { key: "inAppNotifications", label: "In-app" },
                      { key: "expenseReminder", label: "Reminder" },
                      { key: "weeklySummary", label: "Weekly" },
                      { key: "monthlySummary", label: "Monthly" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        role="switch"
                        aria-checked={row[item.key]}
                        aria-label={`${user.name} ${item.label} notifications`}
                        onClick={() =>
                          toggleUserNotificationPref(
                            row.userId,
                            item.key,
                            !row[item.key]
                          )
                        }
                        disabled={savingPrefs[row.userId]}
                        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                          row[item.key] ? "bg-teal-600" : "bg-slate-200"
                        } ${savingPrefs[row.userId] ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            row[item.key] ? "translate-x-[18px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
const UsersSection = ({ currentUserId, onDelete, onExport }) => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (page = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", pagination.limit);
      if (query.trim()) params.set("search", query.trim());
      if (role !== "all") params.set("role", role);

      const res = await api.get(`/user?${params.toString()}`);
      setUsers(res.data.users || []);
      setAdmins(res.data.admins || []);
      setPagination((prev) => ({
        ...prev,
        page,
        total: res.data.pagination?.total ?? 0,
        totalPages: res.data.pagination?.totalPages ?? 0,
      }));
    } catch (error) {
      console.log("Fetch users error:", error);
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query, role, pagination.limit]);

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    fetchUsers(page);
  };

  const fetchAllUsers = async () => {
    const all = [];
    let page = 1;
    const limit = 100;
    for (;;) {
      const params = new URLSearchParams({ page, limit });
      if (query.trim()) params.set("search", query.trim());
      if (role !== "all") params.set("role", role);
      const res = await api.get(`/user?${params.toString()}`);
      const body = res.data || {};
      const pageUsers = Array.isArray(body.users) ? body.users : [];
      const pageAdmins = Array.isArray(body.admins) ? body.admins : [];
      all.push(
        ...pageUsers.map((item) => ({ ...item, displayRole: "user" })),
        ...pageAdmins.map((item) => ({ ...item, displayRole: "admin" }))
      );
      if (pageUsers.length < limit && pageAdmins.length < limit) break;
      page += 1;
      if (page > 20) break;
    }
    return all;
  };

  const handleExport = async () => {
    try {
      const all = await fetchAllUsers();
      if (all.length === 0) {
        toast.info("There are no users to export yet.");
        return;
      }
      const rows = [
        ["Name", "Email", "Role", "Joined"],
        ...all.map((item) => [
          item.name,
          item.email,
          item.displayRole,
          item.createdAt?.slice(0, 10) || "",
        ]),
      ];
      downloadCsv(`expense-tracker-users-${todayISO()}.csv`, rows);
      toast.success("User directory exported");
    } catch (error) {
      toast.error("Could not export users");
    }
  };

  const rows = useMemo(() => [...users, ...admins], [users, admins]);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={Users}
          title="Users & administrators"
          subtitle={`${users.length + admins.length} total · Page ${pagination.page} of ${Math.max(1, pagination.totalPages)}`}
        />
        <button type="button" onClick={handleExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export directory
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder="Search by name, email or role…"
          className="flex-1 lg:w-[320px]"
        />
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 sm:w-[140px]"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading users…" className="h-[300px]" />
      ) : rows.length === 0 ? (
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
                {rows.map((item) => (
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
            {rows.map((item) => (
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/60">
              <div className="text-[11px] text-slate-500">
                Page <strong>{pagination.page}</strong> of{" "}
                <strong>{Math.max(1, pagination.totalPages)}</strong>
                · {pagination.total} total{" "}
                {pagination.total === 1 ? "user" : "users"}
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
                {[...Array(Math.max(1, pagination.totalPages))].map((_, i) => {
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
  );
};

/* ------------------------------------------------------------------ */
/*  Transactions                                                       */
/* ------------------------------------------------------------------ */
const TransactionsSection = ({ onExport }) => {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userMap, setUserMap] = useState({});
  const [categoryOptions, setCategoryOptions] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  const fetchUserMap = async () => {
    try {
      const all = [];
      let page = 1;
      const limit = 100;
      for (;;) {
        const res = await api.get(`/user?page=${page}&limit=${limit}`);
        const body = res.data || {};
        all.push(...(body.users || []), ...(body.admins || []));
        if (page >= (body.pagination?.totalPages || 1)) break;
        page += 1;
        if (page > 20) break;
      }
      const map = {};
      all.forEach((entry) => {
        map[entry.id] = entry.name;
      });
      setUserMap(map);
    } catch (error) {
      console.log("Fetch user map error:", error);
    }
  };

  const fetchTransactions = async (page = pagination.page) => {
    setLoading(true);
    try {
      const baseParams = {
        page,
        limit: pagination.limit,
        sort: "newest",
      };
      if (query.trim()) baseParams.search = query.trim();
      if (category !== "All") baseParams.category = category;
      if (minAmount.trim()) baseParams.minAmount = minAmount;
      if (maxAmount.trim()) baseParams.maxAmount = maxAmount;
      if (startDate) baseParams.startDate = startDate;
      if (endDate) baseParams.endDate = endDate;

      const buildUrl = (extra) => {
        const params = new URLSearchParams({ ...baseParams, ...extra });
        return `/expense/user?${params.toString()}`;
      };

      let expenses = [];
      let credits = [];
      let expenseTotal = 0;
      let creditTotal = 0;
      let expensePages = 1;
      let creditPages = 1;

      if (type === "all" || type === "Expense") {
        const res = await api.get(buildUrl({}));
        const body = res.data || {};
        expenses = Array.isArray(body.data) ? body.data : [];
        expenseTotal = body.pagination?.total ?? 0;
        expensePages = body.pagination?.totalPages ?? 1;
      }
      if (type === "all" || type === "Income") {
        // Credits use `method`, not `category` – do not send the category
        // filter to the credit endpoint or all credits would be returned.
        const creditParams = { ...baseParams };
        delete creditParams.category;
        const res = await api.get(`/credit/user?${new URLSearchParams(creditParams).toString()}`);
        const body = res.data || {};
        credits = Array.isArray(body.data) ? body.data : [];
        creditTotal = body.pagination?.total ?? 0;
        creditPages = body.pagination?.totalPages ?? 1;
      }

      const merged = [
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

      // Derive category options dynamically from actual data
      const dynamicCategories = [
        "All",
        ...[
          ...new Set(merged.map((item) => item.category).filter(Boolean)),
        ].sort((a, b) => a.localeCompare(b)),
      ];
      setCategoryOptions(dynamicCategories);

      setRows(merged);
      setPagination((prev) => ({
        ...prev,
        page,
        total: expenseTotal + creditTotal,
        totalPages: Math.max(expensePages, creditPages),
      }));
    } catch (error) {
      console.log("Fetch transactions error:", error);
      toast.error("Could not load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMap();
    fetchTransactions();
  }, [query, type, category, minAmount, maxAmount, startDate, endDate, pagination.limit]);

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    fetchTransactions(page);
  };

  const handleExport = async () => {
    try {
      const all = await fetchAllTransactions();
      if (all.length === 0) {
        toast.info("There are no transactions to export yet.");
        return;
      }
      downloadCsv(`expense-tracker-platform-transactions-${todayISO()}.csv`, [
        ["Date", "Type", "Title", "Category / Method", "User", "Amount (INR)"],
        ...all.map((item) => [
          item.date?.slice(0, 10) || "",
          item.type,
          item.title,
          item.category,
          item.userName,
          item.amount,
        ]),
      ]);
      toast.success("Platform transactions exported");
    } catch (error) {
      toast.error("Could not export transactions");
    }
  };

  const fetchAllTransactions = async () => {
    const all = [];
    let page = 1;
    const limit = 100;
    for (;;) {
      const params = new URLSearchParams({
        page,
        limit,
        sort: "newest",
      });
      if (query.trim()) params.set("search", query.trim());
      if (category !== "All") params.set("category", category);
      if (minAmount.trim()) params.set("minAmount", minAmount);
      if (maxAmount.trim()) params.set("maxAmount", maxAmount);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      // Credits use `method`, not `category` – build credit params without
      // category so all credits aren't returned when filtering by category.
      const creditParams = new URLSearchParams();
      for (const [key, value] of params) {
        if (key !== "category") creditParams.set(key, value);
      }

      const [expRes, credRes] = await Promise.all([
        api.get(`/expense/user?${params.toString()}`),
        api.get(`/credit/user?${creditParams.toString()}`),
      ]);
      const expBody = expRes.data || {};
      const credBody = credRes.data || {};
      const exps = Array.isArray(expBody.data) ? expBody.data : [];
      const creds = Array.isArray(credBody.data) ? credBody.data : [];
      all.push(
        ...exps.map((item) => ({
          id: `expense-${item.id}`,
          type: "Expense",
          title: item.title,
          category: item.category || "Other",
          date: item.date,
          amount: Number(item.amount || 0),
          userName: userMap[item.userId] || "Unknown user",
        })),
        ...creds.map((item) => ({
          id: `income-${item.id}`,
          type: "Income",
          title: item.source,
          category: item.method || "Other",
          date: item.date,
          amount: Number(item.amount || 0),
          userName: userMap[item.userId] || "Unknown user",
        }))
      );
      if (exps.length < limit && creds.length < limit) break;
      page += 1;
      if (page > 20) break;
    }
    return all
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 1000);
  };

  const filteredTotal = rows.reduce((sum, item) => sum + item.amount, 0);

  const hasFilters =
    query.trim() ||
    type !== "all" ||
    category !== "All" ||
    minAmount.trim() ||
    maxAmount.trim() ||
    startDate ||
    endDate;

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={List}
          title="Monitor transactions"
          subtitle={
            hasFilters
              ? `Filtered transactions · ${pagination.total} total match${pagination.total === 1 ? "" : "es"}`
              : `${pagination.total} total entries across the platform`
          }
        />
        <button type="button" onClick={handleExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder="Search by title, user or category…"
          className="flex-1 lg:w-[300px]"
        />
        <div className="flex gap-2 w-full lg:w-auto">
          {[
            { key: "all", label: "All" },
            { key: "Expense", label: "Expenses" },
            { key: "Income", label: "Income" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setType(option.key);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                type === option.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 sm:w-[170px]"
            aria-label="Filter by category"
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 w-full lg:flex-row lg:items-center">
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(event) => {
              setMinAmount(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Min amount"
            className="field h-[42px] py-0 w-[120px] text-sm"
            aria-label="Minimum amount"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxAmount}
            onChange={(event) => {
              setMaxAmount(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Max amount"
            className="field h-[42px] py-0 w-[120px] text-sm"
            aria-label="Maximum amount"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 w-[140px] text-sm"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 w-[140px] text-sm"
            aria-label="End date"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("all");
              setCategory("All");
              setMinAmount("");
              setMaxAmount("");
              setStartDate("");
              setEndDate("");
              setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
            }}
            className="btn btn-ghost btn-sm h-[42px] text-slate-500"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
        <p className="text-[10.5px] font-medium text-slate-500">
          {rows.length} {rows.length === 1 ? "entry" : "entries"} on this page
        </p>
        <p className="text-[10.5px] font-bold text-slate-700">
          Total: {formatMoney(filteredTotal)}
        </p>
      </div>

      {loading ? (
        <PageLoader label="Loading transactions…" className="h-[300px]" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={List}
          title="No transactions found"
          description="Try a different search term or change the filters."
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
                {rows.map((item) => (
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
                      <p className="text-[13px] font-semibold text-slate-800">
                        {item.title}
                      </p>
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
            {rows.map((item) => (
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/60">
              <div className="text-[11px] text-slate-500">
                Page <strong>{pagination.page}</strong> of{" "}
                <strong>{Math.max(1, pagination.totalPages)}</strong>
                · {pagination.total} total{" "}
                {pagination.total === 1 ? "entry" : "entries"}
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
                {[...Array(Math.max(1, pagination.totalPages))].map((_, i) => {
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
const AuditLogsSection = ({ onExport }) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [module, setModule] = useState("all");
  const [user, setUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userMap, setUserMap] = useState({});
  const [actionOptions, setActionOptions] = useState(["all"]);
  const [moduleOptions, setModuleOptions] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const toggleDetail = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatJson = (value) => {
    if (value === null || value === undefined) return "—";
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(value);
    }
  };

  const fetchUserMap = async () => {
    try {
      const all = [];
      let page = 1;
      const limit = 100;
      for (;;) {
        const res = await api.get(`/user?page=${page}&limit=${limit}`);
        const body = res.data || {};
        all.push(...(body.users || []), ...(body.admins || []));
        if (page >= (body.pagination?.totalPages || 1)) break;
        page += 1;
        if (page > 20) break;
      }
      const map = {};
      all.forEach((entry) => {
        map[entry.id] = entry.name;
      });
      setUserMap(map);
    } catch (error) {
      console.log("Fetch user map error:", error);
    }
  };

  const fetchLogs = async (page = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", pagination.limit);
      if (query.trim()) params.set("user", query.trim());
      if (action !== "all") params.set("action", action);
      if (module !== "all") params.set("module", module);
      if (user.trim()) params.set("user", user.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await api.get(`/audit?${params.toString()}`);
      const body = res.data || {};
      const pageLogs = Array.isArray(body.data) ? body.data : [];
      setLogs(
        pageLogs.map((log) => ({
          ...log,
          actor: userMap[log.userId] || log.actor || "Unknown user",
        }))
      );

      // Derive action and module options dynamically from actual data
      const dynamicActions = [
        "all",
        ...[...new Set(pageLogs.map((log) => log.action).filter(Boolean))].sort(),
      ];
      const dynamicModules = [
        "all",
        ...[...new Set(pageLogs.map((log) => log.module).filter(Boolean))].sort(),
      ];

      // Always include credit/income filter options even when no credit logs exist yet
      const creditActions = ["CREDIT_CREATE", "CREDIT_UPDATE", "CREDIT_DELETE"];
      const creditModules = ["credit"];
      setActionOptions([...new Set([...dynamicActions, ...creditActions])]);
      setModuleOptions([...new Set([...dynamicModules, ...creditModules])]);

      setPagination((prev) => ({
        ...prev,
        page,
        total: body.pagination?.total ?? 0,
        totalPages: body.pagination?.totalPages ?? 0,
      }));
    } catch (error) {
      console.log("Fetch audit logs error:", error);
      toast.error("Could not load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMap();
    fetchLogs();
  }, [query, action, module, user, startDate, endDate, pagination.limit]);

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
    fetchLogs(page);
  };

  const handleExport = async () => {
    try {
      const all = await fetchAllAuditLogs();
      if (all.length === 0) {
        toast.info("There are no audit records to export yet.");
        return;
      }
      downloadCsv(`expense-tracker-audit-logs-${todayISO()}.csv`, [
        ["Time", "Action", "Actor", "Target", "Amount (INR)", "Type"],
        ...all.map((log) => [
          log.createdAt ? new Date(log.createdAt).toISOString() : "",
          log.action,
          log.actor,
          log.target,
          log.amount,
          log.type,
        ]),
      ]);
      toast.success("Audit trail exported");
    } catch (error) {
      toast.error("Could not export audit trail");
    }
  };

  const fetchAllAuditLogs = async () => {
    const all = [];
    let page = 1;
    const limit = 100;
    for (;;) {
      const params = new URLSearchParams({ page, limit });
      if (query.trim()) params.set("user", query.trim());
      if (action !== "all") params.set("action", action);
      if (module !== "all") params.set("module", module);
      if (user.trim()) params.set("user", user.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await api.get(`/audit?${params.toString()}`);
      const body = res.data || {};
      const pageLogs = Array.isArray(body.data) ? body.data : [];
      all.push(...pageLogs);
      if (pageLogs.length < limit) break;
      page += 1;
      if (page > 20) break;
    }
    return all;
  };

  const hasFilters =
    query.trim() ||
    action !== "all" ||
    module !== "all" ||
    user.trim() ||
    startDate ||
    endDate;

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionTitle
          icon={FileText}
          title="Audit logs"
          subtitle={
            hasFilters
              ? `Filtered audit trail · ${pagination.total} total match${pagination.total === 1 ? "" : "es"}`
              : "Platform audit trail (server-side)"
          }
        />
        <button type="button" onClick={handleExport} className="btn btn-secondary btn-sm">
          <Download size={14} />
          Export trail
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder="Search actions, actors or targets…"
          className="flex-1 lg:w-[280px]"
        />
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 sm:w-[150px]"
            aria-label="Filter by action"
          >
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All actions" : item}
              </option>
            ))}
          </select>
          <select
            value={module}
            onChange={(event) => {
              setModule(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 sm:w-[150px]"
            aria-label="Filter by module"
          >
            {moduleOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All modules" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 w-full lg:flex-row lg:items-center">
        <div className="flex gap-2">
          <input
            type="text"
            value={user}
            onChange={(event) => {
              setUser(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Filter by user (name or id)…"
            className="field h-[42px] py-0 w-[220px] text-sm"
            aria-label="Filter audit logs by user"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 w-[140px] text-sm"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="field h-[42px] py-0 w-[140px] text-sm"
            aria-label="End date"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setAction("all");
              setModule("all");
              setUser("");
              setStartDate("");
              setEndDate("");
              setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
            }}
            className="btn btn-ghost btn-sm h-[42px] text-slate-500"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <PageLoader label="Loading audit logs…" className="h-[300px]" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit records found"
          description="Try a different search term or change the filters."
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
                  <th>Module</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-[11px] text-slate-500">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap text-[13px] font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="whitespace-nowrap text-xs text-slate-500">
                        {log.module}
                      </td>
                      <td className="whitespace-nowrap text-xs text-slate-600">
                        {log.actor}
                      </td>
                      <td className="max-w-[220px] truncate text-xs text-slate-600">
                        {log.details || log.target || "—"}
                      </td>
                      <td className="whitespace-nowrap text-right text-xs font-bold text-slate-700">
                        {formatMoney(log.amount)}
                      </td>
                      <td className="text-right">
                        <Badge tone={log.type === "Expense" ? "rose" : "emerald"}>
                          {log.type || "—"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleDetail(log.id)}
                          className="p-1 text-slate-400 hover:text-teal-600 focus:outline-none"
                          aria-label={expandedLogId === log.id ? "Hide details" : "Show details"}
                        >
                          {expandedLogId === log.id ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={8}>
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-semibold uppercase text-slate-500">
                                Change details
                              </span>
                              {log.previousValue !== null && log.previousValue !== undefined && (
                                <span className="text-[10px] text-rose-600 font-semibold">Previous</span>
                              )}
                              {log.newValue !== null && log.newValue !== undefined && (
                                <span className="text-[10px] text-emerald-600 font-semibold">New</span>
                              )}
                            </div>
                            <div className="grid gap-2">
                              {log.previousValue !== null && log.previousValue !== undefined && (
                                <div>
                                  <div className="text-[10px] text-rose-600 font-semibold mb-1">
                                    Previous value
                                  </div>
                                  <pre className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 overflow-x-auto whitespace-pre-wrap break-words">
                                    {formatJson(log.previousValue)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue !== null && log.newValue !== undefined && (
                                <div>
                                  <div className="text-[10px] text-emerald-600 font-semibold mb-1">
                                    New value
                                  </div>
                                  <pre className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 overflow-x-auto whitespace-pre-wrap break-words">
                                    {formatJson(log.newValue)}
                                  </pre>
                                </div>
                              )}
                              {(!log.previousValue && !log.newValue) && (
                                <p className="text-[11px] text-slate-400 italic">
                                  No field-level change data recorded for this action.
                                </p>
                              )}
                              {log.details && (
                                <div className="mt-3">
                                  <div className="text-[10px] text-slate-500 font-semibold mb-1">
                                    Details
                                  </div>
                                  <pre className="text-[10px] text-slate-700 bg-white p-2 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
                                    {formatJson(log.details)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800">
                      {log.action}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      {log.actor} · {formatDateTime(log.createdAt)}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-400">
                      {log.details || log.target || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDetail(log.id)}
                      className="p-1 text-slate-400 hover:text-teal-600 focus:outline-none"
                      aria-label={expandedLogId === log.id ? "Hide details" : "Show details"}
                    >
                      {expandedLogId === log.id ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    <div className="text-right">
                      <Badge tone={log.type === "Expense" ? "rose" : "emerald"}>
                        {log.type || "—"}
                      </Badge>
                      <p className="mt-1 text-[11px] font-bold text-slate-700">
                        {formatMoney(log.amount)}
                      </p>
                    </div>
                  </div>
                </div>
                {expandedLogId === log.id && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">
                        Change details
                      </span>
                      {log.previousValue !== null && log.previousValue !== undefined && (
                        <span className="text-[10px] text-rose-600 font-semibold">Previous</span>
                      )}
                      {log.newValue !== null && log.newValue !== undefined && (
                        <span className="text-[10px] text-emerald-600 font-semibold">New</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {log.previousValue !== null && log.previousValue !== undefined && (
                        <div>
                          <div className="text-[10px] text-rose-600 font-semibold">
                            Previous value
                          </div>
                          <pre className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 overflow-x-auto whitespace-pre-wrap break-words">
                            {formatJson(log.previousValue)}
                          </pre>
                        </div>
                      )}
                      {log.newValue !== null && log.newValue !== undefined && (
                        <div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            New value
                          </div>
                          <pre className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 overflow-x-auto whitespace-pre-wrap break-words">
                            {formatJson(log.newValue)}
                          </pre>
                        </div>
                      )}
                      {log.details && (
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Details
                          </div>
                          <pre className="text-[10px] text-slate-700 bg-white p-2 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
                            {formatJson(log.details)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/60">
              <div className="text-[11px] text-slate-500">
                Page <strong>{pagination.page}</strong> of{" "}
                <strong>{Math.max(1, pagination.totalPages)}</strong>
                · {pagination.total} total{" "}
                {pagination.total === 1 ? "record" : "records"}
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
                {[...Array(Math.max(1, pagination.totalPages))].map((_, i) => {
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
  );
};

/* ------------------------------------------------------------------ */
/*  Security                                                           */
/* ------------------------------------------------------------------ */
const SecuritySection = ({ onExportAudit }) => {
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
            subtitle="Platform security and audit controls"
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
