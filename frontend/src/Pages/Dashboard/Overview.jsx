import React from "react";

const Overview = () => {
  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow text-center hover:shadow-md transition">
          <h2 className="text-gray-500 text-sm font-medium">Total Expenses</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">₹12,450</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-center hover:shadow-md transition">
          <h2 className="text-gray-500 text-sm font-medium">No. of Transactions</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">34</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-center hover:shadow-md transition">
          <h2 className="text-gray-500 text-sm font-medium">Average Expense</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">₹366</p>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-indigo-700">
          Recent Expenses
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm sm:text-base">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-gray-600">Date</th>
                <th className="p-2 text-gray-600">Title</th>
                <th className="p-2 text-gray-600">Category</th>
                <th className="p-2 text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="p-2">10 Nov 2025</td>
                <td className="p-2">Lunch</td>
                <td className="p-2">Food</td>
                <td className="p-2 text-red-500 font-medium">₹250</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-2">09 Nov 2025</td>
                <td className="p-2">Cab Ride</td>
                <td className="p-2">Transport</td>
                <td className="p-2 text-red-500 font-medium">₹180</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
