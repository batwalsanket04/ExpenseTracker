import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { loadPreferences } from "../../utils/preferences";

const Dashboard = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [compactTables, setCompactTables] = useState(
    () => loadPreferences().compactTables
  );
  const location = useLocation();

  useEffect(() => {
    setCompactTables(loadPreferences().compactTables);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-slate-800">
      {/* Mobile backdrop */}
      <div
        onClick={() => setIsMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl shadow-slate-950/10 transition-transform duration-300 ease-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setIsMobileOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen flex-col md:pl-[280px]">
        <header className="sticky top-0 z-30 shrink-0 border-b border-[#e6e4dd] bg-[#fbfaf7]/90 backdrop-blur-xl">
          <Navbar onMenuClick={() => setIsMobileOpen(true)} />
        </header>

        <main className={`relative flex-1 ${compactTables ? "compact-tables" : ""}`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-teal-50/60 via-[#f6f5f0]/20 to-transparent" />
          <div className="relative mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>

        <footer className="relative mx-auto flex w-full max-w-[1480px] flex-col items-center justify-between gap-2 border-t border-[#e6e4dd] px-4 py-5 text-[11px] text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Secure session · JWT protected
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
