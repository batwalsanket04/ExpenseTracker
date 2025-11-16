import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("userName"); 
    if (name) setUserName(name);
  }, []);

 const handleLogout = () => {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("token");
  window.confirm("Are You sure you went to Logout..?")
  localStorage.clear();
  navigate("/login",{replace:true})

};



  return (
    <div className="flex justify-between items-center bg-white shadow-md rounded-xl p-4 px-6 mb-8 transition-all duration-300 ml-[30px]">
      <h1 className="text-2xl font-bold text-indigo-700">Expense Tracker 💰</h1>

      <div className="flex items-center gap-4">
        {userName ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-700">{userName}</span>
          </div>
        ) : (
          <span className="font-semibold text-gray-700">Guest</span>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
