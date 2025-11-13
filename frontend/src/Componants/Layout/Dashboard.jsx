import React, { useState } from "react";
import { Menu } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom"; // 👈 Import Outlet

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <div
        className={`fixed md:static z-40 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Navbar */}
        <div className="sticky top-0 z-20 bg-white">
          <div className="flex items-center justify-between p-4 shadow-md md:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-indigo-100 rounded-lg hover:bg-indigo-200"
            >
              <Menu size={22} className="text-indigo-700" />
            </button>
            <h1 className="text-lg font-bold text-indigo-700">
              Expense Tracker 💰
            </h1>
          </div>
          <div className="hidden md:block">
            <Navbar />
          </div>
        </div>

        {/*  This is the blank area where nested route components will render */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
