import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { NotificationItem } from "@/features/notifications/components/notification-item.jsx";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service.js";

const TYPE_OPTIONS = [
  ["", "All types"],
  ["achievement_unlocked", "Achievements"],
  ["mvp_award", "MVP awards"],
  ["challenge_completed", "Challenges"],
  ["title_earned", "Titles"],
  ["match_verified", "Verified matches"],
  ["match_rejected", "Rejected matches"],
  ["player_account_linked", "Player linking"],
  ["season_started", "Season started"],
  ["season_completed", "Season completed"],
  ["system_announcement", "Announcements"],
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [readStatus, setReadStatus] = useState("all");
  const [type, setType] = useState("");

  const query = useQuery({
    queryKey: ["notifications", { page, readStatus, type }],
    queryFn: () =>
      getNotifications({
        page,
        limit: 12,
        readStatus,
        ...(type ? { type } : {}),
      }),
  });

  async function refreshNotificationQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
    ]);
  }

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshNotificationQueries,
    onError: (error) => toast.error(error.message ?? "Unable to update notification."),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async (result) => {
      await refreshNotificationQueries();
      toast.success(
        result.data.updatedCount > 0
          ? `${result.data.updatedCount} notifications marked as read.`
          : "No unread notifications remained.",
      );
    },
    onError: (error) => toast.error(error.message ?? "Unable to update notifications."),
  });

  function openNotification(notification) {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    navigate(notification.actionUrl);
  }

  const notifications = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const unreadCount = query.data?.meta?.unreadCount ?? 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="League activity"
        title="Notifications"
        description="Review official match updates, awards, achievements, challenges and season events."
        icon={Bell}
        action={
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={18} aria-hidden="true" />
            Mark all read
          </button>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
        <label className="grid flex-1 gap-2 text-sm font-black">
          Read status
          <select
            value={readStatus}
            onChange={(event) => {
              setReadStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </select>
        </label>
        <label className="grid flex-1 gap-2 text-sm font-black">
          Event type
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <div className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-black dark:bg-slate-800">
            {unreadCount} unread
          </div>
        </div>
      </div>

      {query.isPending ? <LoadingState title="Loading notifications" /> : null}
      {query.isError ? (
        <ErrorState
          title="Notifications unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data && notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="There are no notifications matching the selected filters."
        />
      ) : null}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={openNotification}
              onMarkRead={(notificationId) => markReadMutation.mutate(notificationId)}
              isUpdating={markReadMutation.isPending}
            />
          ))}
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft size={17} aria-hidden="true" /> Previous
          </button>
          <p className="text-sm font-black">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black disabled:opacity-40 dark:border-slate-700"
          >
            Next <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
