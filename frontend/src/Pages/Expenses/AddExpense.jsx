import React, { useState } from "react";
import { CalendarDays, IndianRupee, Plus, Tag, FileText } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Spinner } from "../../components/ui";
import { CATEGORY_OPTIONS } from "../../utils/categoryMeta";
import { todayISO } from "../../utils/format";

const initialData = {
  title: "",
  amount: "",
  category: "",
  date: todayISO(),
  note: "",
};

const AddExpense = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleForm = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !data.title.trim() ||
      !data.amount ||
      Number(data.amount) <= 0 ||
      !data.category ||
      !data.date
    ) {
      toast.warning("Add a title, amount, category and date before saving.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/expense/add", {
        ...data,
        title: data.title.trim(),
        amount: Number(data.amount),
      });

      setData({ ...initialData, date: todayISO() });
      toast.success(response.data.message || "Expense added successfully");
    } catch (error) {
      console.log("Add expense error:", error);
      toast.error(error.response?.data?.message || "Could not save the expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-title" className="label-field">
            Expense title
          </label>
          <div className="relative">
            <Tag
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="expense-title"
              type="text"
              name="title"
              value={data.title}
              onChange={handleForm}
              placeholder="e.g. Weekly groceries"
              required
              className="field field-icon h-[44px] py-0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="expense-amount" className="label-field">
            Amount
          </label>
          <div className="relative">
            <IndianRupee
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="expense-amount"
              type="number"
              name="amount"
              value={data.amount}
              onChange={handleForm}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              className="field field-icon h-[44px] py-0"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-category" className="label-field">
            Category
          </label>
          <select
            id="expense-category"
            name="category"
            value={data.category}
            onChange={handleForm}
            required
            className="field h-[44px] py-0"
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="expense-date" className="label-field">
            Date
          </label>
          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="expense-date"
              type="date"
              name="date"
              value={data.date}
              onChange={handleForm}
              required
              className="field field-icon h-[44px] py-0"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="expense-note" className="label-field">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <FileText
            size={16}
            className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
          />
          <textarea
            id="expense-note"
            name="note"
            value={data.note}
            onChange={handleForm}
            placeholder="Add a little context for this expense…"
            rows={3}
            className="field field-icon resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10.5px] leading-relaxed text-slate-400">
          Expenses are private to your account and included in your reports.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto"
        >
          {loading ? <Spinner size={15} /> : <Plus size={16} strokeWidth={2.5} />}
          {loading ? "Saving…" : "Add expense"}
        </button>
      </div>
    </form>
  );
};

export default AddExpense;
