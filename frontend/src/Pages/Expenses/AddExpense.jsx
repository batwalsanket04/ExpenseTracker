import React, { useState } from "react";
import axios from "axios";

const AddExpense = () => {
  const [data, setData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    note: "",
  });

  const handleForm = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const userId = localStorage.getItem("userId");

    const res = await axios.post("http://localhost:3000/api/expense/add", {
      ...data,
      userId,   // ✔ correctly sent inside body
    });

    setData({
      title: "",
      amount: "",
      category: "",
      date: "",
      note: "",
    });

    alert(res.data.message || "Expense Added Successfully!");
  } catch (error) {
    console.log("Error", error);
    alert("Error connecting to server");
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="title"
          value={data.title}
          onChange={handleForm}
          placeholder="Expense Title"
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
        <input
          type="number"
          name="amount"
          value={data.amount}
          onChange={handleForm}
          placeholder="Amount (₹)"
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <select
          name="category"
          value={data.category}
          onChange={handleForm}
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
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
          value={data.date}
          onChange={handleForm}
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
      </div>

      <textarea
        name="note"
        value={data.note}
        onChange={handleForm}
        placeholder="Add a note (optional)"
        rows={3}
        className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full resize-none"
      ></textarea>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-medium shadow-sm"
      >
         Add Expense
      </button>
    </form>
  );
};

export default AddExpense;
