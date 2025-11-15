import React, { useState, useEffect } from "react";
import axios from "axios";

const EditCredit = ({ isOpen, onClose, credit, onUpdate }) => {
  const [form, setForm] = useState({
    _id: "",
    source: "",
    amount: "",
    date: "",
    method: "",
    note: ""
  });

  // Load selected credit data into form
  useEffect(() => {
    if (credit) {
      setForm({
        _id: credit._id,
        source: credit.source,
        amount: credit.amount,
        date: credit.date?.slice(0, 10),
        method: credit.method || "",
        note: credit.note || ""
      });
    }
  }, [credit]);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        `http://localhost:3000/api/credit/${form._id}`,
        form
      );

      onUpdate(res.data.credit); // parent update
      alert("Credit Updated Successfully");
      onClose();
    } catch (error) {
      console.log("Error:", error);
      alert("Something went wrong while updating credit.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
        
        <h2 className="text-2xl font-semibold mb-5 text-center">
          Edit Credit
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>

          <input
            type="text"
            name="source"
            value={form.source}
            onChange={handleChange}
            placeholder="Credit Source"
            className="w-full border border-gray-300 p-3 rounded-lg"
          />

          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount (₹)"
            className="w-full border border-gray-300 p-3 rounded-lg"
          />

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg"
          />

          <select
            name="method"
            value={form.method}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg"
          >
            <option value="">Payment Method</option>
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Other</option>
          </select>

          <textarea
            name="note"
            rows={3}
            value={form.note}
            onChange={handleChange}
            placeholder="Note (optional)"
            className="w-full border border-gray-300 p-3 rounded-lg resize-none"
          ></textarea>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Update
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default EditCredit;
