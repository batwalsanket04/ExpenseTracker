import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; 
import {
  Home,
  PlusCircle,
  List,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { icon: <Home size={18} />, label: "Dashboard", path: "/dashboard/overview" },
    { icon: <PlusCircle size={18} />, label: "Add Transaction", path: "/dashboard/add-expense" },
    { icon: <List size={18} />, label: "Show Expenses", path: "/dashboard/show-expense" },
    { icon: <List size={18} />, label: "Show Credits", path: "/dashboard/show-credits" },
    { icon: <Settings size={18} />, label: "Setting", path: "/dashboard/setting" },
  ];

  return (
    <div
      className={`min-h-full max-h-full bg-indigo-700 text-white flex flex-col justify-between shadow-lg transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } rounded-2xl`}
    >
      <div>
        <div className="flex items-center justify-between px-4 py-5 border-b border-indigo-500">
          {isOpen && <h1 className="text-xl font-bold tracking-wide">💰 ExpenseApp</h1>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md hover:bg-indigo-600"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2">
          {menuItems.map((item, index) => (
            <div key={index} className="relative group">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    isActive ? "bg-indigo-600" : "hover:bg-indigo-600"
                  }`
                }
              >
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </NavLink>

              {!isOpen && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-indigo-500 relative group">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          <LogOut size={18} />
          {isOpen && <span>Logout</span>}
        </button>

        {!isOpen && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition">
            Logout
          </span>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
