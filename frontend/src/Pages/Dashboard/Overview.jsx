import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowDownCircle, ArrowUpCircle, Layers, Wallet } from "lucide-react";

const Overview = () => {
  const userId = localStorage.getItem("userId");

  const [totalExpense, setTotalExpense] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [creditCount, setCreditCount] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentCredits, setRecentCredits] = useState([]);

  const fetchData = async () => {
    try {
      const exp = await axios.get(`http://localhost:3000/api/expense/user/${userId}`);
      const credit = await axios.get(`http://localhost:3000/api/credit/user/${userId}`);

      const expData = exp.data;
      const creditData = credit.data.data;

      // Totals
      setTotalExpense(expData.reduce((sum, e) => sum + Number(e.amount), 0));
      setTotalCredit(creditData.reduce((sum, e) => sum + Number(e.amount), 0));

      setExpenseCount(expData.length);
      setCreditCount(creditData.length);

      // Sort & get recent 5
      const sortedExp = [...expData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      const sortedCredit = [...creditData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentExpenses(sortedExp);
      setRecentCredits(sortedCredit);
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">

        {/* Expense Total */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <ArrowDownCircle className="text-red-600" size={32} />
          <div>
            <p className="text-sm text-gray-500">Total Expense</p>
            <p className="text-2xl font-bold text-red-600">₹{totalExpense}</p>
          </div>
        </div>

        {/* Credit Total */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <ArrowUpCircle className="text-green-600" size={32} />
          <div>
            <p className="text-sm text-gray-500">Total Credit</p>
            <p className="text-2xl font-bold text-green-600">₹{totalCredit}</p>
          </div>
        </div>

        {/* Expense Count */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <Layers className="text-indigo-600" size={32} />
          <div>
            <p className="text-sm text-gray-500">Expense Count</p>
            <p className="text-2xl font-bold">{expenseCount}</p>
          </div>
        </div>

        {/* Credit Count */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <Wallet className="text-yellow-600" size={32} />
          <div>
            <p className="text-sm text-gray-500">Credit Count</p>
            <p className="text-2xl font-bold">{creditCount}</p>
          </div>
        </div>
      </div>

   

      {/* Recent Credits */}
  
<div className="bg-white p-6 rounded-xl shadow">
  <h3 className="text-xl font-semibold text-red-700 mb-4">Recent 5 Expenses</h3>

  {/* SCROLL AREA */}
  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
    {recentExpenses.map((e) => (
      <div
        key={e._id}
        className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-sm hover:bg-gray-200 transition"
      >
        <div className="w-1/3">
          <p className="font-semibold text-gray-800">{e.title}</p>
          <p className="text-xs text-gray-500">{e.category}</p>
        </div>

        <p className="font-bold text-red-600 w-1/4">- ₹{e.amount}</p>

        <p className="text-sm text-gray-600 w-1/4">{e.date.slice(0, 10)}</p>

        <p className="text-xs w-1/6 text-right text-gray-500">
          {e.method || "—"}
        </p>
      </div>
    ))}
  </div>
</div>

{/* Recent Credits */}
<div className="bg-white p-6 rounded-xl shadow">
  <h3 className="text-xl font-semibold text-green-700 mb-4">Recent 5 Credits</h3>

  {/* SCROLL AREA */}
  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
    {recentCredits.map((c) => (
      <div
        key={c._id}
        className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-sm hover:bg-gray-200 transition"
      >
        <div className="w-1/3">
          <p className="font-semibold text-gray-800">{c.source}</p>
        </div>

        <p className="font-bold text-green-600 w-1/4">+ ₹{c.amount}</p>

        <p className="text-sm text-gray-600 w-1/4">{c.date.slice(0, 10)}</p>

        <p className="text-xs w-1/6 text-right text-gray-500">
          {c.method || "—"}
        </p>
      </div>
    ))}
  </div>
</div>


    </div>
  );
};

export default Overview;
