import React, { useEffect, useState } from "react";
import { Users, Trash2, Shield } from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../Context/storeContext";
import { toast } from "react-toastify";

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/user");
      setUsers(res.data.users || []);
      setAdmins(res.data.admins || []);
    } catch (error) {
      console.log("Fetch users error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    if (id === currentUser.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    try {
      await api.delete(`/user/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.log("Delete error:", error);
      toast.error("Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-700 flex items-center gap-2">
            <Users size={24} /> Manage Users
          </h1>
          <p className="text-gray-500">
            View and manage all registered users and admins.
          </p>
        </div>
        <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
          Admin Panel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserTable
          title="Regular Users"
          icon={<Shield className="text-blue-600" size={20} />}
          data={users}
          onDelete={(id) => handleDelete(id, "user")}
          emptyMessage="No regular users found."
        />
        <UserTable
          title="Admins"
          icon={<Shield className="text-teal-600" size={20} />}
          data={admins}
          onDelete={(id) => handleDelete(id, "admin")}
          emptyMessage="No admins found."
        />
      </div>
    </div>
  );
};

const UserTable = ({ title, icon, data, onDelete, emptyMessage }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-teal-100 text-teal-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onDelete(u.id)}
                      className="text-xs text-red-600 hover:text-red-800 underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
