import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { USER_ROLES, USER_STATUSES } from "@mini-militia/shared";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import {
  getUsers,
  linkUserPlayer,
  unlinkUserPlayer,
  updateUserRole,
  updateUserStatus,
} from "@/services/user.service.js";

const roleOptions = Object.values(USER_ROLES);
const statusOptions = Object.values(USER_STATUSES);

function UserRow({ user, onAction, isPending }) {
  const [reason, setReason] = useState("Administrative account update");
  const [playerId, setPlayerId] = useState("");
  const canSubmit = reason.trim().length >= 3 && !isPending;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-black">{user.name}</h2>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <p className="mt-1 break-all text-xs text-slate-400">{user.id}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase dark:bg-slate-800">
          {user.role} · {user.status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">
          Role
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-amber-500 dark:border-slate-700"
            value={user.role}
            disabled={isPending}
            onChange={(event) =>
              onAction("role", { userId: user.id, role: event.target.value, reason })
            }
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Status
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-amber-500 dark:border-slate-700"
            value={user.status}
            disabled={isPending}
            onChange={(event) =>
              onAction("status", {
                userId: user.id,
                status: event.target.value,
                reason,
              })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block text-sm font-bold">
        Audit reason
        <input
          className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-amber-500 dark:border-slate-700"
          value={reason}
          minLength={3}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="min-w-48 flex-1 rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-amber-500 dark:border-slate-700"
          placeholder="MM001 or player MongoDB ID"
          value={playerId}
          onChange={(event) => setPlayerId(event.target.value)}
        />
        <button
          type="button"
          disabled={!canSubmit || !playerId.trim()}
          onClick={() => onAction("link", { userId: user.id, playerId, reason })}
          className="rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Link player
        </button>
        {user.linkedPlayerId ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onAction("unlink", { userId: user.id, reason })}
            className="rounded-xl border border-red-300 px-4 py-2.5 font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            Unlink
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Linked player ID: {user.linkedPlayerId ?? "None"}
      </p>
    </article>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const usersQuery = useQuery({
    queryKey: ["admin-users", { search, page }],
    queryFn: () => getUsers({ search: search || undefined, page, limit: 10 }),
  });
  const actionMutation = useMutation({
    mutationFn: ({ type, payload }) => {
      if (type === "role") return updateUserRole(payload);
      if (type === "status") return updateUserStatus(payload);
      if (type === "link") return linkUserPlayer(payload);
      return unlinkUserPlayer(payload);
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const result = usersQuery.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin only"
        title="User access management"
        description="Manage roles, account status and user-to-player links through audited server-side workflows."
        icon={UserRoundCog}
      />
      <label className="relative block max-w-xl">
        <span className="sr-only">Search users</span>
        <Search
          className="absolute left-3 top-3 text-slate-400"
          size={19}
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search users by name or email"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      {usersQuery.isPending ? (
        <LoadingState
          title="Loading user accounts"
          description="Retrieving paginated account and access details."
        />
      ) : null}
      {usersQuery.isError ? (
        <ErrorState
          description={usersQuery.error.message}
          onRetry={() => usersQuery.refetch()}
        />
      ) : null}
      {result?.data?.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {result.data.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isPending={actionMutation.isPending}
              onAction={(type, payload) => actionMutation.mutate({ type, payload })}
            />
          ))}
        </div>
      ) : null}
      {result && result.data.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Change the search term or register a new account."
        />
      ) : null}

      {result?.pagination && result.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={!result.pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Previous
          </button>
          <span className="text-sm font-bold">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!result.pagination.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
