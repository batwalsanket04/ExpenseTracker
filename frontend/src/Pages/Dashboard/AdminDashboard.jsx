import React, { useEffect, useState } from "react";
import { Users, Shield, ArrowDownCircle, ArrowUpCircle, Activity } from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../Context/storeContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalExpense: 0,
    totalCredit: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchStats = async () => {
    try {
      const [userRes, expRes, creditRes] = await Promise.all([
        api.get("/user"),
        api.get("/expense/user"),
        api.get("/credit/user"),
      ]);

      const totalUsers = (userRes.data.users && userRes.data.users.length) || 0;
      const totalAdmins = (userRes.data.admins && userRes.data.admins.length) || 0;

      const expData = Array.isArray(expRes.data) ? expRes.data : [];
      const creditData =
        creditRes.data && Array.isArray(creditRes.data.data)
          ? creditRes.data.data
          : [];

      setStats({
        totalUsers,
        totalAdmins,
        totalExpense: expData.reduce((sum, e) => sum + Number(e.amount || 0), 0),
        totalCredit: creditData.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      });

      const allActivity = [
        ...expData.map((e) => ({
          ...e,
          type: "Expense",
          date: e.date,
          amount: e.amount,
          title: e.title,
        })),
        ...creditData.map((c) => ({
          ...c,
          type: "Credit",
          date: c.date,
          amount: c.amount,
          title: c.source,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      setRecentActivity(allActivity);
    } catch (error) {
      console.log("Admin Dashboard Error:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">Admin Dashboard 🛡️</h1>
          <p className="text-gray-500">
            Manage the platform and view aggregated data across all users.
          </p>
        </div>
        <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
          Admin: {user?.name}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-blue-600" size={32} />}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Shield className="text-teal-600" size={32} />}
          label="Total Admins"
          value={stats.totalAdmins}
          color="bg-teal-50 text-teal-600"
        />
        <StatCard
          icon={<ArrowDownCircle className="text-red-600" size={32} />}
          label="Total Expense"
          value={`₹${stats.totalExpense}`}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<ArrowUpCircle className="text-green-600" size={32} />}
          label="Total Credit"
          value={`₹${stats.totalCredit}`}
          color="bg-green-50 text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity size={20} /> Recent Platform Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title / Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === "Expense"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === "Expense" ? "-" : "+"} ₹{item.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.date ? item.date.slice(0, 10) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const [bg, text] = color.split(" ");
  return (
    <div className={`bg-white p-6 rounded-xl shadow flex items-center gap-4 ${bg}`}>
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${text}`}>{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
