import React from "react";
import { useContext } from "react";
const Navbar = () => {
 
  return (
    <div 
      className="flex justify-between items-center bg-white shadow-md rounded-xl p-4 px-6 mb-8 transition-all duration-300 ml-[30px]"
         // space for sidebar width
    >
      {/* App Title */}
      <h1 className="text-2xl font-bold text-indigo-700">Expense Tracker 💰</h1>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* User Avatar + Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">
            
          </div>
          <span className="font-semibold text-gray-700">User Name</span>
        </div>

        {/* Theme Toggle */}
        

        {/* Logout Button */}
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
