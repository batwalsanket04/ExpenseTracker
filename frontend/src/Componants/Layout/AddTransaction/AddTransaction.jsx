import React from "react";
import AddExpense from "../../../Pages/Expenses/AddExpense";
import AddCredit from "../../../Pages/Credit/AddCredit";

const AddTransaction = () => {
  return (
    <div className="flex flex-col justify-center items-center bg-gray-50 px-6 py-8 min-h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-indigo-700">Add Transaction</h2>
        <p className="text-gray-500 mt-2">
          Easily record your expenses and credits below 
        </p>
      </div>

      {/* Grid Layout */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Expense */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
          <div className="border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-1">
              Add Expense 
            </h3>
            <span className="text-sm text-gray-400">Expense Entry</span>
          </div>
          <AddExpense />
        </div>

        {/* Credit */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
          <div className="border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-1">
              Add Credit 
            </h3>
            <span className="text-sm text-gray-400">Credit Entry</span>
          </div>
          <AddCredit />
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
