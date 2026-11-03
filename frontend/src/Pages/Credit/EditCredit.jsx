import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  Pencil,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Modal, Spinner } from "../../components/ui";
import { PAYMENT_METHODS } from "../../utils/categoryMeta";

const EditCredit = ({ isOpen, onClose, credit, onUpdate }) => {
  const [form, setForm] = useState({
    id: "",
    source: "",
    amount: "",
    date: "",
    method: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (credit) {
      setForm({
        id: credit.id,
        source: credit.source || "",
        amount: credit.amount || "",
        date: credit.date?.slice(0, 10) || "",
        method: credit.method || "",
        note: credit.note || "",
      });
    }
  }, [credit]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/credit/${form.id}`, form);
      onUpdate(response.data.credit);
      toast.success("Income entry updated successfully");
      onClose();
    } catch (error) {
      console.log("Update credit error:", error);
      toast.error(error.response?.data?.message || "Could not update the income entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title="Edit income"
      subtitle="Update the details and save your changes."
      icon={<Pencil size={18} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-credit-source" className="label-field">
              Income source
            </label>
            <div className="relative">
              <Wallet
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-credit-source"
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                required
                className="field field-icon h-[44px] py-0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-credit-amount" className="label-field">
              Amount
            </label>
            <div className="relative">
              <IndianRupee
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-credit-amount"
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
            <label htmlFor="edit-credit-date" className="label-field">
              Date received
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="edit-credit-date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="field field-icon h-[44px] py-0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-credit-method" className="label-field">
              Payment method
            </label>
            <div className="relative">
              <CreditCard
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                id="edit-credit-method"
                name="method"
                value={form.method}
                onChange={handleChange}
                required
                className="field field-icon h-[44px] py-0"
              >
                <option value="">Select a method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="edit-credit-note" className="label-field">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <FileText
              size={16}
              className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
            />
            <textarea
              id="edit-credit-note"
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              className="field field-icon resize-none"
              placeholder="Add a note…"
            />
          </div>
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

export default EditCredit;
