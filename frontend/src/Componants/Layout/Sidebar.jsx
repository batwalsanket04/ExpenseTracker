import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/storeContext";
import { ConfirmDialog, Logo, Avatar } from "../../components/ui";
import {
  LayoutDashboard,
  CirclePlus,
  ReceiptText,
  PiggyBank,
  PieChart,
  BarChart3,
  ShieldCheck,
  Users,
  ArrowLeftRight,
  FileText,
  Lock,
  Settings,
  LogOut,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";

const workspaceNav = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Add transaction", to: "/dashboard/add-expense", icon: CirclePlus },
  { label: "Expenses", to: "/dashboard/show-expense", icon: ReceiptText },
  { label: "Income", to: "/dashboard/show-credits", icon: PiggyBank },
  { label: "Budgets", to: "/dashboard/budgets", icon: PieChart },
  { label: "Reports", to: "/dashboard/reports", icon: BarChart3 },
];

const adminNav = [
  { label: "Admin console", to: "/dashboard/admin", icon: ShieldCheck },
  { label: "Users", to: "/dashboard/admin?tab=users", icon: Users },
  {
    label: "Transactions",
    to: "/dashboard/admin?tab=transactions",
    icon: ArrowLeftRight,
  },
  { label: "Audit logs", to: "/dashboard/admin?tab=audit", icon: FileText },
  { label: "Security", to: "/dashboard/admin?tab=security", icon: Lock },
];

const accountNav = [
  { label: "Settings", to: "/dashboard/setting", icon: Settings },
];

const SidebarLink = ({ item, active, onNavigate }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? "bg-teal-50 text-teal-950 shadow-sm ring-1 ring-teal-100"
          : "text-slate-600 hover:bg-[#f1f0ea] hover:text-slate-900"
      }`}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-600" />
      )}
      <Icon
        size={18}
        strokeWidth={active ? 2.3 : 2}
        className={active ? "text-teal-700" : "text-slate-400 group-hover:text-teal-600"}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(15,118,110,0.4)]" />
      )}
    </Link>
  );
};

const NavGroup = ({ label, items, isActive, onNavigate }) => (
  <div className="mb-5">
    <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.22em] text-slate-400">
      {label}
    </p>
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarLink
          key={item.label}
          item={item}
          active={isActive(item)}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  </div>
);

const Sidebar = ({ onNavigate }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const isAdmin = role === "admin";

  const currentPath = `${location.pathname}${location.search}`;

  const isActive = (item) => {
    if (item.to.includes("?")) return currentPath === item.to;
    if (item.to === "/dashboard/admin") return currentPath === "/dashboard/admin";
    if (item.to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === item.to;
  };

  const displayName = user?.name || localStorage.getItem("userName") || "User";
  const displayEmail = user?.email || "Signed in";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  return (
    <div className="relative flex h-full flex-col overflow-hidden border-r border-[#e8e5de] bg-[#fbfaf7] text-slate-600">
      {/* Brand */}
      <div className="relative flex h-[72px] shrink-0 items-center justify-between border-b border-[#e8e5de] px-5">
        <Link to="/dashboard" onClick={onNavigate} className="min-w-0">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <div className="relative flex-1 overflow-y-auto px-3 py-5">
        <NavGroup
          label="Workspace"
          items={workspaceNav}
          isActive={isActive}
          onNavigate={onNavigate}
        />

        {isAdmin && (
          <NavGroup
            label="Administration"
            items={adminNav}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        )}

        <NavGroup
          label="Account"
          items={accountNav}
          isActive={isActive}
          onNavigate={onNavigate}
        />
      </div>

      {/* Footer */}
      <div className="relative shrink-0 border-t border-[#e8e5de] p-3">
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-teal-100 bg-[#f0f7f4] p-3.5">
          <div className="flex items-center gap-2 text-teal-700">
            <Sparkles size={14} />
            <p className="text-[11px] font-semibold uppercase tracking-wider">
              Smart habit
            </p>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Log expenses the moment they happen — small records build big clarity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl bg-white p-2 ring-1 ring-[#e8e5de]">
          <Link
            to="/dashboard/setting"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 transition hover:bg-[#f7f6f1]"
          >
            <Avatar name={displayName} size="md" className="ring-white" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="truncate text-[10.5px] text-slate-500">{displayEmail}</p>
            </div>
          </Link>
          <span className="hidden rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100 sm:inline">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        <Link
          to="/dashboard/setting"
          onClick={onNavigate}
          className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 transition hover:text-teal-700"
        >
          Manage account
          <ChevronRight size={11} />
        </Link>
      </div>

      <ConfirmDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
        title="Sign out of ExpenseTracker?"
        message="You'll need to sign in again to access your dashboard and records."
        confirmLabel="Sign out"
        tone="danger"
      />
    </div>
  );
};

export default Sidebar;
