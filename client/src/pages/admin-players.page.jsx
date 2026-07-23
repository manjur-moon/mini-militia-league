import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";
import {
  playerFormSchema,
  toPlayerPayload,
} from "@/features/players/schemas/player.schemas.js";
import {
  createPlayer,
  deletePlayerPhoto,
  getPlayers,
  updatePlayer,
  updatePlayerStatus,
  uploadPlayerPhoto,
} from "@/services/player.service.js";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700";

function PlayerForm({ player, isPending, onSubmit, onCancel }) {
  const form = useForm({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: player?.name ?? "",
      aliasesText: player?.aliases?.join(", ") ?? "",
      joinDate: player?.joinDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      status: player?.status ?? "active",
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => onSubmit(toPlayerPayload(values)))}
    >
      <label className="text-sm font-bold">
        Player name
        <input className={inputClass} {...form.register("name")} />
        <span className="mt-1 block text-xs text-red-600">
          {form.formState.errors.name?.message}
        </span>
      </label>
      <label className="text-sm font-bold">
        Aliases
        <input
          className={inputClass}
          placeholder="Alias one, alias two"
          {...form.register("aliasesText")}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Join date
          <input type="date" className={inputClass} {...form.register("joinDate")} />
          <span className="mt-1 block text-xs text-red-600">
            {form.formState.errors.joinDate?.message}
          </span>
        </label>
        {!player ? (
          <label className="text-sm font-bold">
            Initial status
            <select className={inputClass} {...form.register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold dark:border-slate-700"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-50"
        >
          {player ? "Save changes" : "Create player"}
        </button>
      </div>
    </form>
  );
}

function AdminPlayerCard({ player, mutation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusReason, setStatusReason] = useState("Administrative status update");

  const handlePhoto = (event) => {
    const [file] = event.target.files;
    if (file)
      mutation.mutate({ type: "photo", payload: { playerId: player.playerId, file } });
    event.target.value = "";
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
              {player.playerId}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize dark:bg-slate-800">
              {player.status}
            </span>
          </div>
          <h2 className="mt-2 truncate text-xl font-black">{player.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Joined {new Date(player.joinDate).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          className="grid size-10 place-items-center rounded-xl border border-slate-300 dark:border-slate-700"
          aria-label={`Edit ${player.name}`}
        >
          {isEditing ? <X size={18} /> : <Pencil size={18} />}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
          <PlayerForm
            player={player}
            isPending={mutation.isPending}
            onCancel={() => setIsEditing(false)}
            onSubmit={(input) =>
              mutation.mutate(
                {
                  type: "update",
                  payload: {
                    playerId: player.playerId,
                    name: input.name,
                    aliases: input.aliases,
                    joinDate: input.joinDate,
                    expectedUpdatedAt: player.updatedAt,
                    reason: "Player profile edited from admin dashboard",
                  },
                },
                { onSuccess: () => setIsEditing(false) },
              )
            }
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <label className="text-sm font-bold">
          Status-change reason
          <input
            value={statusReason}
            onChange={(event) => setStatusReason(event.target.value)}
            className={inputClass}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={mutation.isPending || statusReason.trim().length < 3}
            onClick={() =>
              mutation.mutate({
                type: "status",
                payload: {
                  playerId: player.playerId,
                  status: player.status === "active" ? "inactive" : "active",
                  reason: statusReason,
                },
              })
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
          >
            {player.status === "active" ? "Deactivate" : "Activate"}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-700">
            <Camera size={16} />{" "}
            {player.profileImage ? "Replace photo" : "Upload photo"}
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhoto}
            />
          </label>
          {player.profileImage ? (
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  type: "delete-photo",
                  payload: {
                    playerId: player.playerId,
                    reason: "Player photo removed from admin dashboard",
                  },
                })
              }
              className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-600 dark:border-red-900"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AdminPlayersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("active");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  const playersQuery = useQuery({
    queryKey: ["admin-players", { search: deferredSearch, status, sortBy, page }],
    queryFn: () =>
      getPlayers({
        search: deferredSearch || undefined,
        status,
        sortBy,
        sortOrder: sortBy === "name" ? "asc" : "desc",
        page,
        limit: 10,
      }),
  });

  const mutation = useMutation({
    mutationFn: ({ type, payload }) => {
      if (type === "create") return createPlayer(payload);
      if (type === "update") return updatePlayer(payload);
      if (type === "status") return updatePlayerStatus(payload);
      if (type === "photo") return uploadPlayerPhoto(payload);
      return deletePlayerPhoto(payload);
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const result = playersQuery.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin only"
        title="Player management"
        description="Create, edit, activate, deactivate and manage public player identities without deleting historical records."
        icon={UserRound}
        action={
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950"
          >
            {showCreate ? <X size={18} /> : <Plus size={18} />}
            {showCreate ? "Close form" : "New player"}
          </button>
        }
      />

      {showCreate ? (
        <section className="rounded-3xl border border-amber-300 bg-amber-50/50 p-6 dark:border-amber-500/30 dark:bg-amber-500/5">
          <h2 className="mb-5 text-xl font-black">Create player</h2>
          <PlayerForm
            isPending={mutation.isPending}
            onCancel={() => setShowCreate(false)}
            onSubmit={(payload) =>
              mutation.mutate(
                { type: "create", payload },
                { onSuccess: () => setShowCreate(false) },
              )
            }
          />
        </section>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <span className="sr-only">Search players</span>
          <Search className="absolute left-3 top-3 text-slate-400" size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, alias or MM ID"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Filter by player status"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Sort players"
        >
          <option value="createdAt">Newest</option>
          <option value="joinDate">Join date</option>
          <option value="name">Name</option>
          <option value="playerId">Player ID</option>
        </select>
      </div>

      {playersQuery.isPending ? <LoadingState title="Loading players" /> : null}
      {playersQuery.isError ? (
        <ErrorState
          description={playersQuery.error.message}
          onRetry={() => playersQuery.refetch()}
        />
      ) : null}
      {result?.data?.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {result.data.map((player) => (
            <AdminPlayerCard
              key={player.playerId}
              player={player}
              mutation={mutation}
            />
          ))}
        </div>
      ) : null}
      {result && result.data.length === 0 ? (
        <EmptyState
          title="No players found"
          description="Change the filters or create a player."
        />
      ) : null}
      {result?.pagination?.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={!result.pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 font-bold disabled:opacity-40 dark:border-slate-700"
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
            className="rounded-xl border border-slate-300 px-4 py-2 font-bold disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
