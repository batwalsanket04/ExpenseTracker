import React, { useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";

const BudgetAlerts = ({ autoToast = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get("/budget-preferences/alerts");
        const data = response.data || {};
        setAlerts(data.data || []);

        // Show toast notifications for active alerts
        if (autoToast && data.data && data.data.length > 0) {
          const { enableInAppAlert } = data.preferences || {};
          if (enableInAppAlert !== false) {
            data.data.forEach((alert) => {
              if (alert.isOver) {
                toast.error(alert.message, {
                  toastId: `budget-alert-${alert.budgetId}`,
                  autoClose: 6000,
                });
              } else if (alert.isWarning) {
                toast.warn(alert.message, {
                  toastId: `budget-alert-${alert.budgetId}`,
                  autoClose: 6000,
                });
              }
            });
          }
        }
      } catch (error) {
        console.log("Fetch budget alerts error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [autoToast]);

  if (loading) return null;

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="surface p-4 sm:p-6 border border-rose-200 bg-rose-50/50 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 mt-0.5">
            <AlertTriangle size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold text-rose-900">
              Budget Alerts ({alerts.length})
            </h3>
            <p className="mt-1 text-xs text-rose-700">
              One or more budgets have reached or exceeded their alert threshold.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAlerts([])}
            className="text-[10px] text-rose-500 hover:text-rose-700"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.budgetId}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                  alert.isOver
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {alert.isOver ? <TrendingDown size={14} /> : <Bell size={14} />}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate">
                  {alert.category} budget
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                  {alert.isOver
                    ? "Budget exceeded"
                    : `At ${alert.percentage}% of limit`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-[12px] font-bold ${
                alert.isOver ? "text-rose-600" : "text-amber-600"
              }`}>
                {alert.isOver ? "Over by" : "Left "}
                {formatMoneyNumber(Math.abs(alert.remaining))}
              </p>
              <p className="text-[10px] text-slate-500">
                ₹{formatMoneyNumber(alert.spent)} / ₹{formatMoneyNumber(
                alert.allocated
              )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatMoneyNumber = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default BudgetAlerts;
