import React, { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  Plus,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Spinner } from "../../components/ui";
import { PAYMENT_METHODS } from "../../utils/categoryMeta";
import { todayISO } from "../../utils/format";

const initialData = {
  source: "",
  amount: "",
  date: todayISO(),
  method: "",
  note: "",
};

const AddCredit = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !data.source.trim() ||
      !data.amount ||
      Number(data.amount) <= 0 ||
      !data.date ||
      !data.method
    ) {
      toast.warning("Add a source, amount, date and payment method before saving.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/credit/add", {
        ...data,
        source: data.source.trim(),
        amount: Number(data.amount),
      });

      setData({ ...initialData, date: todayISO() });
      toast.success(response.data.message || "Income added successfully");
    } catch (error) {
      console.log("Add credit error:", error);
      toast.error(error.response?.data?.message || "Could not save the income entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="credit-source" className="label-field">
            Income source
          </label>
          <div className="relative">
            <Wallet
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="credit-source"
              type="text"
              name="source"
              value={data.source}
              onChange={handleChange}
              placeholder="e.g. Monthly salary"
              required
              className="field field-icon h-[44px] py-0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="credit-amount" className="label-field">
            Amount
          </label>
          <div className="relative">
            <IndianRupee
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="credit-amount"
              type="number"
              name="amount"
              value={data.amount}
              onChange={handleChange}
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
          <label htmlFor="credit-date" className="label-field">
            Date received
          </label>
          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="credit-date"
              type="date"
              name="date"
              value={data.date}
              onChange={handleChange}
              required
              className="field field-icon h-[44px] py-0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="credit-method" className="label-field">
            Payment method
          </label>
          <div className="relative">
            <CreditCard
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              id="credit-method"
              name="method"
              value={data.method}
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
        <label htmlFor="credit-note" className="label-field">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <FileText
            size={16}
            className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
          />
          <textarea
            id="credit-note"
            name="note"
            value={data.note}
            onChange={handleChange}
            placeholder="Add a little context for this income…"
            rows={3}
            className="field field-icon resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10.5px] leading-relaxed text-slate-400">
          Income entries increase your balance and appear in monthly reports.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto"
        >
          {loading ? <Spinner size={15} /> : <Plus size={16} strokeWidth={2.5} />}
          {loading ? "Saving…" : "Add income"}
        </button>
      </div>
    </form>
  );
};

export default AddCredit;
