import React, { useEffect, useState } from "react";
import { CalendarDays, FileText, IndianRupee, Pencil, Tag } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Modal, Spinner } from "../../components/ui";
import { CATEGORY_OPTIONS } from "../../utils/categoryMeta";

const EditExpense = ({ isOpen, onClose, expense, onUpdate }) => {
  const [form, setForm] = useState({
    id: "",
    title: "",
    amount: "",
    category: "",
    date: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        id: expense.id,
        title: expense.title || "",
        amount: expense.amount || "",
        category: expense.category || "",
        date: expense.date?.slice(0, 10) || "",
        note: expense.note || "",
      });
    }
  }, [expense]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/expense/${form.id}`, form);
      onUpdate(response.data.updated);
      toast.success("Expense updated successfully");
      onClose();
    } catch (error) {
      console.log("Update expense error:", error);
      toast.error(error.response?.data?.message || "Could not update the expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title="Edit expense"
      subtitle="Update the details and save your changes."
      icon={<Pencil size={18} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-expense-title" className="label-field">
              Expense title
            </label>
            <div className="relative">
              <Tag
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-expense-title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="field field-icon h-[44px] py-0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-expense-amount" className="label-field">
              Amount
            </label>
            <div className="relative">
              <IndianRupee
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-expense-amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
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
            <label htmlFor="edit-expense-category" className="label-field">
              Category
            </label>
            <select
              id="edit-expense-category"
              name="category"
              value={form.category}
              onChange={handleChange}
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
            <label htmlFor="edit-expense-date" className="label-field">
              Date
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-expense-date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="field field-icon h-[44px] py-0"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="edit-expense-note" className="label-field">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="edit-expense-note"
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={3}
            className="field resize-none"
            placeholder="Add a note…"
          />
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Spinner size={15} />}
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditExpense;
