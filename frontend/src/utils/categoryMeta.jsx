import {
  Utensils,
  Fuel,
  ReceiptText,
  ShoppingBag,
  Film,
  Shapes,
} from "lucide-react";

export const CATEGORY_OPTIONS = [
  "Food",
  "Petrol",
  "Bills",
  "Shopping",
  "Entertainment",
  "Other",
];

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Card",
  "Other",
];

export const CATEGORY_META = {
  Food: {
    icon: Utensils,
    iconBox: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    bar: "bg-amber-500",
    hex: "#f59e0b",
  },
  Petrol: {
    icon: Fuel,
    iconBox: "bg-sky-50 text-sky-600 ring-1 ring-sky-100",
    bar: "bg-sky-500",
    hex: "#0ea5e9",
  },
  Bills: {
    icon: ReceiptText,
    iconBox: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
    bar: "bg-teal-600",
    hex: "#0f766e",
  },
  Shopping: {
    icon: ShoppingBag,
    iconBox: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
    bar: "bg-rose-500",
    hex: "#f43f5e",
  },
  Entertainment: {
    icon: Film,
    iconBox: "bg-pink-50 text-pink-600 ring-1 ring-pink-100",
    bar: "bg-pink-500",
    hex: "#ec4899",
  },
  Other: {
    icon: Shapes,
    iconBox: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    bar: "bg-slate-500",
    hex: "#64748b",
  },
};

export const getCategoryMeta = (category) =>
  CATEGORY_META[category] || CATEGORY_META.Other;
