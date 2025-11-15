import axios from "axios";
import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EditExpense from "./EditExpenses";

const ShowExpense = () => {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState({});

  // Fetch expenses ONLY for logged-in user
 const FetchData = async () => {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId || userId === "null") {
      console.log("No userId found in localStorage");
      return;
    }

    const res = await axios.get(
      `http://localhost:3000/api/expense/user/${userId}`
    );

    setData(res.data);    
  } catch (error) {
    console.log("Error fetching:", error);
  }
};

  // Delete expense
  const deleteExp = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:3000/api/expense/${id}`);

      setData((prev) => prev.filter((item) => item._id !== id));

      alert(res.data.message || "Expense Deleted Successfully...");
    } catch (error) {
      console.log("Error", error);
      alert("Error connecting to server");  
    }
  };

  // Update expense after edit modal
  const form = (updated) => {
    setData((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    );
  };

  useEffect(() => {
    FetchData();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Expense Overview
        </h2>
        <p className="text-gray-500">Track all your transactions in one place.</p>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-center text-lg mt-10">
          No expenses found.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scroll">
          {data.map((val) => (
            <div
              key={val._id}
              className="backdrop-blur-xl bg-white/40 border border-white/30 shadow-lg rounded-2xl p-5 hover:scale-[1.03] transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {val.title}
                </h3>

                <p className="mt-3 text-lg font-bold text-red-500">
                  ₹{val.amount}
                </p>

                <p className="mt-2 text-gray-700">
                  <span className="font-medium text-gray-900">Category:</span>{" "}
                  {val.category}
                </p>

                <p className="mt-2 text-gray-700">
                  <span className="font-medium text-gray-900">Date:</span>{" "}
                  {new Date(val.date).toLocaleDateString()}
                </p>

                {val.note && (
                  <p className="mt-2 text-gray-700">
                    <span className="font-medium text-gray-900">Note:</span>{" "}
                    {val.note}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-5">
                {/* Edit */}
                <button
                  onClick={() => {
                    setSelectedExpense(val);
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
                >
                  <Pencil size={18} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteExp(val._id)}
                  className="p-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      <EditExpense
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={selectedExpense}
        onUpdate={form}
      />
    </div>
  );
};

export default ShowExpense;
