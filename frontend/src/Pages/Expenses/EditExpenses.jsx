import React, { useState, useEffect } from "react";
import axios from "axios";

const EditExpense = ({ isOpen, onClose, expense, onUpdate }) => {
  const [form, setForm] = useState({
    _id: "",
    title: "",
    amount: "",
    category: "",
    date: "",
    note: "",
  });

  useEffect(() => {
    if (expense) {
      setForm({
        _id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date?.slice(0, 10),
        note: expense.note || "",
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.put(
        `http://localhost:3000/api/expense/${form._id}`,
        form
      );

      onUpdate(res.data.updated);
      alert("Expense Updated Successfully!");
      onClose();
    } catch (error) {
      console.log("Update Error:", error);
      alert("Something went wrong!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">

        <h2 className="text-2xl font-bold text-indigo-600 mb-4 text-center">
          Edit Expense
        </h2>

        {/* Form */}
        <div className="space-y-4">

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Expense Title"
              className="border border-gray-300 focus:border-indigo-500 
              focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
            />

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount (₹)"
              className="border border-gray-300 focus:border-indigo-500 
              focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="border border-gray-300 focus:border-indigo-500 
              focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
            >
              <option value="">Select Category</option>
              <option>Food</option>
              <option>Petrol</option>
              <option>Bills</option>
              <option>Shopping</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="border border-gray-300 focus:border-indigo-500 
              focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
            />
          </div>

          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Add a note (optional)"
            rows={3}
            className="border border-gray-300 focus:border-indigo-500 
            focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full resize-none"
          />

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white 
            hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            Update Expense
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditExpense;
