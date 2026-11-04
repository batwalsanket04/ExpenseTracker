import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SectionTitle,
  Spinner,
} from "../../components/ui";

const TYPE_LABELS = {
  budget_alert: "Budget alert",
  expense_reminder: "Expense reminder",
  weekly_summary: "Weekly summary",
  monthly_summary: "Monthly summary",
  system: "System",
};

const TYPE_TONES = {
  budget_alert: "rose",
  expense_reminder: "amber",
  weekly_summary: "teal",
  monthly_summary: "teal",
  system: "indigo",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/notifications/"),
        api.get("/notifications/unread-count"),
      ]);
      const data = notifRes.data.data || [];
      setNotifications(data);
      setUnreadCount(countRes.data.unreadCount || 0);
    } catch (error) {
      console.log("Fetch notifications error:", error);
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const notifyChange = (delta = 0) => {
    window.dispatchEvent(
      new CustomEvent("notifications:changed", { detail: { delta } })
    );
  };

  const markRead = async (id, currentlyRead) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: !currentlyRead } : n
      )
    );
    setUnreadCount((prev) => (currentlyRead ? prev + 1 : prev - 1));
    notifyChange(currentlyRead ? 1 : -1);

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.log("Mark notification read error:", error);
      toast.error("Could not update notification");
      // Revert optimistically
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: currentlyRead } : n))
      );
      setUnreadCount((prev) => (currentlyRead ? prev - 1 : prev + 1));
      notifyChange(currentlyRead ? -1 : 1);
    }
  };

  const markAllRead = async () => {
    const count = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    notifyChange(-count);

    try {
      await api.patch("/notifications/read-all");
      toast.success("All notifications marked as read");
    } catch (error) {
      console.log("Mark all read error:", error);
      toast.error("Could not mark all as read");
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(confirmDeleteId);
    const toDelete = notifications.find((n) => n.id === confirmDeleteId);
    const wasUnread = toDelete && !toDelete.read;
    setNotifications((prev) =>
      prev.filter((n) => n.id !== confirmDeleteId)
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    notifyChange(wasUnread ? -1 : 0);

    try {
      await api.delete(`/notifications/${confirmDeleteId}`);
      toast.success("Notification deleted");
    } catch (error) {
      console.log("Delete notification error:", error);
      toast.error("Could not delete notification");
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner label="Loading notifications…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        subtitle="All your in-app alerts and summaries in one place."
        actions={
          <>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllRead}
                disabled={notifications.length === 0}
              >
                <CheckCircle2 size={14} />
                Mark all as read
              </Button>
            )}
          </>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description={
            unreadCount === 0
              ? "You're all caught up. New alerts and summaries will appear here."
              : "No notifications found."
          }
          className="py-14"
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${
                !notification.read ? "bg-slate-50/50 border border-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TYPE_TONES[notification.type]?.icon}`}>
                <Bell size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                      {notification.title}
                    </p>
                    <Badge tone={TYPE_TONES[notification.type]}>
                      {TYPE_LABELS[notification.type]}
                    </Badge>
                  </div>
                  {!notification.read && (
                    <span className="flex h-2 w-2 rounded-full bg-teal-600" />
                  )}
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-500 mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => markRead(notification.id, notification.read)}
                      className="text-[10px] font-medium transition hover:text-teal-600 px-1"
                    >
                      {notification.read ? "Mark unread" : "Mark read"}
                    </button>
                    <span className="w-[1px] h-3 bg-slate-300 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      className="text-[10px] font-medium text-rose-500 transition hover:text-rose-700 px-1"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting === confirmDeleteId}
        title="Delete notification?"
        message="This notification will be removed permanently. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default Notifications;
