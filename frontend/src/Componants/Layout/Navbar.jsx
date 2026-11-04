import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/storeContext";
import { Avatar, Logo } from "../../components/ui";
import api from "../../utils/api";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Settings,
  Bell,
} from "lucide-react";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/dashboard/add-expense": "Add transaction",
  "/dashboard/show-expense": "Expenses",
  "/dashboard/show-credits": "Income",
  "/dashboard/budgets": "Budgets",
  "/dashboard/reports": "Reports",
  "/dashboard/setting": "Settings",
  "/dashboard/admin": "Admin console",
};

const Navbar = ({ onMenuClick }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifDropdownNotifs, setNotifDropdownNotifs] = useState([]);
  const [notifDropdownLoading, setNotifDropdownLoading] = useState(false);
  const menuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const displayName = user?.name || localStorage.getItem("userName") || "User";
  const displayEmail = user?.email || "Signed in";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
  const pageTitle = PAGE_TITLES[location.pathname.replace(/\/$/, "")] || "Workspace";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        // Silently ignore; notifications may not be available yet.
      }
    };
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refresh badge when the Notifications page marks items read / deleted
  useEffect(() => {
    const onNotifChange = (event) => {
      const delta = event.detail?.delta;
      if (delta !== undefined) {
        setUnreadCount((prev) => Math.max(0, prev + delta));
      }
      fetchUnreadCount();
    };
    window.addEventListener("notifications:changed", onNotifChange);
    return () => window.removeEventListener("notifications:changed", onNotifChange);
  }, []);

  const fetchDropdownNotifications = async () => {
    setNotifDropdownLoading(true);
    try {
      const res = await api.get("/notifications/?limit=5&unreadOnly=false");
      const data = res.data.data || [];
      setNotifDropdownNotifs(data);
    } catch (error) {
      console.log("Fetch dropdown notifications error:", error);
      setNotifDropdownNotifs([]);
    } finally {
      setNotifDropdownLoading(false);
    }
  };

  const handleNotifClickOutside = (event) => {
    if (
      notifMenuRef.current &&
      !notifMenuRef.current.contains(event.target)
    ) {
      setNotifDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleNotifClickOutside);
    return () => document.removeEventListener("mousedown", handleNotifClickOutside);
  }, []);

  return (
    <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="btn btn-secondary h-10 w-10 shrink-0 rounded-xl p-0 md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={19} />
      </button>

      {/* Brand (mobile) */}
      <div className="min-w-0 md:hidden">
        <Logo compact />
      </div>

      {/* Page context (desktop) */}
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-500 shadow-sm lg:flex">
          <CalendarDays size={14} className="text-teal-500" />
          {today}
        </div>

        <Link
          to="/dashboard/add-expense"
          className="btn btn-primary btn-sm hidden sm:inline-flex"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add transaction
        </Link>

        <Link
          to="/dashboard/add-expense"
          className="btn btn-primary h-10 w-10 rounded-xl p-0 sm:hidden"
          aria-label="Add transaction"
        >
          <Plus size={18} />
        </Link>

        {/* Notifications bell */}
        <div
          ref={notifMenuRef}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setNotifDropdownOpen((open) => !open);
              if (!notifDropdownOpen) fetchDropdownNotifications();
            }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notifDropdownOpen}
          >
            <Bell
              size={16}
              className={`text-slate-600 transition ${unreadCount > 0 ? "text-teal-600" : ""}`}
            />
            {unreadCount > 0 && (
              <span
                className="absolute top-[-2px] right-[-2px] z-20 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 animate-fade-up"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <Link
                  to="/dashboard/notifications"
                  className="text-[11px] font-medium text-teal-600 hover:text-teal-700"
                >
                  View all
                </Link>
              </div>

              <div className="p-1.5 max-h-[300px] overflow-y-auto">
                {notifDropdownLoading ? (
                  <div className="flex h-32 items-center justify-center text-slate-400 text-xs">
                    Loading…
                  </div>
                ) : notifDropdownNotifs.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-slate-400 text-xs">
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifDropdownNotifs.map((n) => (
                      <Link
                        key={n.id}
                        to="/dashboard/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          n.read ? "bg-slate-100" : "bg-teal-50"
                        }`}>
                          <Bell size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-medium text-slate-900 truncate leading-tight">
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={displayName} size="sm" className="ring-transparent" />
            <div className="hidden max-w-[130px] text-left lg:block">
              <p className="truncate text-xs font-semibold leading-tight text-slate-800">
                {displayName}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {roleLabel}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-up absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
                <Avatar name={displayName} size="lg" className="ring-white" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                  <p className="truncate text-[11px] text-slate-500">{displayEmail}</p>
                  <span className="mt-1 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-600 ring-1 ring-teal-100">
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  to="/dashboard/setting"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  role="menuitem"
                >
                  <Settings size={16} className="text-slate-400" />
                  Account settings
                </Link>
                <Link
                  to="/dashboard/reports"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  role="menuitem"
                >
                  <BarChart3 size={16} className="text-slate-400" />
                  View reports
                </Link>
              </div>

              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
