import React, { useState } from "react";
import axios from "axios";
import {toast} from 'react-toastify'

const AddCredit = () => {
  const [data, setData] = useState({
    source: "",
    amount: "",
    date: "",
    method: "",
    note: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setData(prev => {
      const updated = { ...prev, [name]: value };
      console.log("Updated Data:", updated);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userId = localStorage.getItem("userId");
      console.log("User ID:", userId);

      if (!userId) {
        toast.error("User not found. Please login again!");
        return;
      }

      const res = await axios.post(
        "https://expense-tracker-h9ng.onrender.com/api/credit/add",
        { ...data, userId }
      );

      if (res.status === 200 || res.status === 201) {
         toast.success(res.data.message || "Credit Added Successfully!");
      }

      setData({
        source: "",
        amount: "",
        date: "",
        method: "",
        note: ""
      });

    } catch (error) {
      console.log("Error:", error);
      toast.error("Error connecting to server");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="source"
          value={data.source}
          onChange={handleChange}
          placeholder="Credit Source (e.g., Salary, Refund, Gift)"
          className="border border-gray-300 p-2.5 rounded-lg w-full"
        />

        <input
          type="number"
          name="amount"
          value={data.amount}
          onChange={handleChange}
          placeholder="Amount (₹)"
          className="border border-gray-300 p-2.5 rounded-lg w-full"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="date"
          name="date"
          value={data.date}
          onChange={handleChange}
          className="border border-gray-300 p-2.5 rounded-lg w-full"
        />

        <select
          name="method"
          value={data.method}
          onChange={handleChange}
          className="border border-gray-300 p-2.5 rounded-lg w-full"
        >
          <option value="">Payment Method</option>
          <option>Cash</option>
          <option>Bank Transfer</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Other</option>
        </select>
      </div>

      <textarea
        name="note"
        value={data.note}
        onChange={handleChange}
        placeholder="Note (optional)"
        rows={3}
        className="border border-gray-300 p-2.5 rounded-lg w-full resize-none"
      ></textarea>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-medium"
      >
        Add Credit
      </button>
    </form>
  );
};

export default AddCredit;
