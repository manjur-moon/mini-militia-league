import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { PlayerCard } from "@/features/players/components/player-card.jsx";
import { getPlayers } from "@/services/player.service.js";

export function PlayersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const playersQuery = useQuery({
    queryKey: ["players", { search, page, status: "active" }],
    queryFn: () =>
      getPlayers({ search: search || undefined, page, limit: 12, status: "active" }),
  });
  const result = playersQuery.data;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Public directory"
        title="League players"
        description="Browse active player profiles. Official statistics will appear only after verified matches are available."
        icon={Users}
      />
      <label className="relative block max-w-xl">
        <span className="sr-only">Search players</span>
        <Search className="absolute left-3 top-3 text-slate-400" size={19} />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, alias or MM ID"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      {playersQuery.isPending ? <LoadingState title="Loading players" /> : null}
      {playersQuery.isError ? (
        <ErrorState
          description={playersQuery.error.message}
          onRetry={() => playersQuery.refetch()}
        />
      ) : null}
      {result?.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((player) => (
            <PlayerCard key={player.playerId} player={player} />
          ))}
        </div>
      ) : null}
      {result && result.data.length === 0 ? (
        <EmptyState
          title="No players found"
          description="Try a different name, alias or player ID."
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
    </section>
  );
}
