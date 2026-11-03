import React, { useState } from "react";
import { Link } from "react-router-dom";
import AddExpense from "../../../Pages/Expenses/AddExpense";
import AddCredit from "../../../Pages/Credit/AddCredit";
import { PageHeader } from "../../../components/ui";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  FileText,
  Lightbulb,
  PieChart,
  Plus,
  ReceiptText,
  Tag,
  Target,
  Wallet,
} from "lucide-react";

const tabs = [
  {
    key: "expense",
    label: "Expense",
    description: "Money going out",
    icon: ArrowDownRight,
    active: "text-rose-600",
    iconBox: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  {
    key: "income",
    label: "Income",
    description: "Money coming in",
    icon: ArrowUpRight,
    active: "text-emerald-600",
    iconBox: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
];

const tips = [
  { icon: Clock, text: "Record transactions the same day to keep balances accurate." },
  { icon: Tag, text: "Use short, descriptive titles so history is easy to scan." },
  { icon: PieChart, text: "Choose a category to unlock spending insights and reports." },
  { icon: FileText, text: "Add notes for receipts, clients or anything you may need later." },
];

const AddTransaction = () => {
  const [mode, setMode] = useState("expense");
  const isExpense = mode === "expense";
  const activeTab = tabs.find((tab) => tab.key === mode) || tabs[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New entry"
        title="Add transaction"
        subtitle="Capture money in or out in seconds — your dashboard, budgets and reports update automatically."
        actions={
          <>
            <Link to="/dashboard/show-expense" className="btn btn-secondary">
              <ReceiptText size={16} className="text-rose-500" />
              Expenses
            </Link>
            <Link to="/dashboard/show-credits" className="btn btn-secondary">
              <Wallet size={16} className="text-emerald-500" />
              Income
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Form card */}
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/80 p-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = mode === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMode(tab.key)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all sm:gap-2.5 ${
                      selected
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        selected
                          ? tab.key === "expense"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-emerald-50 text-emerald-600"
                          : "bg-slate-200/70 text-slate-500"
                      }`}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <span className="text-left leading-tight">
                      {tab.label}
                      <span className="hidden text-[9.5px] font-medium text-slate-400 sm:block">
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                  isExpense
                    ? "bg-rose-50 text-rose-600 ring-rose-100"
                    : "bg-emerald-50 text-emerald-600 ring-emerald-100"
                }`}
              >
                <ActiveIcon size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {isExpense ? "Record an expense" : "Record income"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isExpense
                    ? "Every expense you record sharpens your monthly picture."
                    : "Add salary, refunds, gifts or any other money received."}
                </p>
              </div>
            </div>

            {isExpense ? <AddExpense /> : <AddCredit />}
          </div>
        </div>

        {/* Side panel */}
        <aside className="space-y-5">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <Lightbulb size={16} />
              </span>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Quick tips
              </h3>
            </div>
            <ul className="mt-4 space-y-3.5">
              {tips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <li key={tip.text} className="flex gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-teal-400" />
                    <p className="text-[11.5px] leading-relaxed text-slate-500">{tip.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#102a25] p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-teal-500/25 blur-2xl" />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-teal-300 ring-1 ring-white/10">
                <Target size={17} />
              </span>
              <h3 className="mt-3 font-display text-sm font-bold text-white">
                Make the data work for you
              </h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
                Set a category budget and watch your progress update as you add
                transactions.
              </p>
              <Link
                to="/dashboard/budgets"
                className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-teal-300 transition hover:text-teal-200"
              >
                Create a budget
                <Plus size={13} />
              </Link>
            </div>
          </div>

          <div className="surface p-4">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Did you know?
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
              People who record spending daily are more likely to stay within their
              monthly budgets. Small entries, big clarity.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddTransaction;
