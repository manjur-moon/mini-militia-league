import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  createAdminNotification,
  getAdminNotifications,
} from "@/services/notification.service.js";

const EMPTY_FORM = Object.freeze({
  userIdentifier: "",
  title: "",
  message: "",
  actionUrl: "",
  entityType: "",
  entityId: "",
  reason: "Send an approved league announcement.",
});

export function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    readStatus: "all",
    source: "",
  });

  const query = useQuery({
    queryKey: ["admin-notifications", { page, ...filters }],
    queryFn: () =>
      getAdminNotifications({
        page,
        limit: 15,
        readStatus: filters.readStatus,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.source ? { source: filters.source } : {}),
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminNotification,
    onSuccess: async () => {
      setForm({ ...EMPTY_FORM });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      toast.success("Notification sent successfully.");
    },
    onError: (error) => toast.error(error.message ?? "Unable to send notification."),
  });

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const relatedEntity =
      form.entityType && form.entityId
        ? { entityType: form.entityType, entityId: form.entityId }
        : null;
    createMutation.mutate({
      userIdentifier: form.userIdentifier,
      title: form.title,
      message: form.message,
      actionUrl: form.actionUrl || null,
      relatedEntity,
      reason: form.reason,
    });
  }

  const notifications = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communication governance"
        title="Notification management"
        description="Send auditable in-app announcements and review system-generated notification delivery."
        icon={BellRing}
      />

      <SectionCard
        title="Send notification"
        description="Target an active account by Better Auth user ID or exact email address"
      >
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Target user ID or email
            <input
              value={form.userIdentifier}
              onChange={(event) => updateForm("userIdentifier", event.target.value)}
              placeholder="player@example.com"
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Title
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              maxLength={150}
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Message
            <textarea
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
              maxLength={1000}
              required
              className="min-h-28 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Internal action URL (optional)
            <input
              value={form.actionUrl}
              onChange={(event) => updateForm("actionUrl", event.target.value)}
              placeholder="/seasons/season-1"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Related entity type (optional)
            <input
              value={form.entityType}
              onChange={(event) => updateForm("entityType", event.target.value)}
              placeholder="season"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Related entity ID (optional)
            <input
              value={form.entityId}
              onChange={(event) => updateForm("entityId", event.target.value)}
              placeholder="MongoDB ID or stable identifier"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Audit reason
            <input
              value={form.reason}
              onChange={(event) => updateForm("reason", event.target.value)}
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              <Send size={18} aria-hidden="true" />
              Send notification
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Notification delivery log"
        description="System and admin-created notifications are retained as user activity records"
      >
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-black">
            Search title or message
            <input
              value={filters.search}
              onChange={(event) => {
                setFilters((current) => ({ ...current, search: event.target.value }));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Read status
            <select
              value={filters.readStatus}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  readStatus: event.target.value,
                }));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            Source
            <select
              value={filters.source}
              onChange={(event) => {
                setFilters((current) => ({ ...current, source: event.target.value }));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All sources</option>
              <option value="system">System</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {query.isPending ? <LoadingState title="Loading notification log" /> : null}
        {query.isError ? (
          <ErrorState
            title="Notification log unavailable"
            description={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : null}
        {query.data && notifications.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No notification records"
            description="No notifications match the current filters."
          />
        ) : null}
        {notifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Notification</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="p-3">
                      <p className="font-black">
                        {notification.user?.name ?? "Unknown user"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {notification.user?.email ?? notification.userId}
                      </p>
                    </td>
                    <td className="max-w-md p-3">
                      <p className="font-black">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {notification.message}
                      </p>
                    </td>
                    <td className="p-3 text-xs font-bold uppercase tracking-wider">
                      {notification.type.replaceAll("_", " ")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          notification.isRead
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {notification.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-between">
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
      </SectionCard>
    </div>
  );
}
