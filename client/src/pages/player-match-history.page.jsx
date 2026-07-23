import { useQuery } from "@tanstack/react-query";
import { Activity, Crosshair, Skull, Trophy } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getPlayerMatches } from "@/services/player.service.js";

export function PlayerMatchHistoryPage() {
  const { playerId } = useParams();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["player-match-history", playerId, page],
    queryFn: () => getPlayerMatches(playerId, { page, limit: 10 }),
  });

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to={`/players/${playerId}`}
        className="font-bold text-amber-700 dark:text-amber-300"
      >
        ← Back to player profile
      </Link>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Verified history
        </p>
        <h1 className="mt-3 text-4xl font-black">
          {query.data?.meta?.player?.name ?? playerId} matches
        </h1>
      </div>
      {query.isPending ? <LoadingState title="Loading player matches" /> : null}
      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}
      {query.data?.data?.length ? (
        <div className="grid gap-4">
          {query.data.data.map((item) => (
            <Link
              key={item.match.id}
              to={`/matches/${item.match.id}`}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-amber-400 sm:grid-cols-[140px_1fr_auto] dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={item.match.screenshot.secureUrl}
                alt={item.match.matchCode}
                className="aspect-video w-full rounded-xl object-cover sm:w-36"
                loading="lazy"
              />
              <div>
                <h2 className="font-black">{item.match.matchCode}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(item.match.matchDate).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Crosshair size={16} /> {item.kills} kills
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <Skull size={16} /> {item.deaths} deaths
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity size={16} /> {item.kdr.toFixed(2)} KDR
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-2 self-start rounded-full bg-amber-500/15 px-3 py-1 text-sm font-black text-amber-700 dark:text-amber-300">
                <Trophy size={16} /> #{item.placement}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      {query.data && !query.data.data.length ? (
        <EmptyState
          title="No verified matches"
          description="This player has not appeared in a verified result yet."
        />
      ) : null}
      {query.data?.pagination?.totalPages > 1 ? (
        <div className="flex justify-center gap-4">
          <button
            disabled={!query.data.pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-xl border px-4 py-2 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="py-2 font-bold">Page {query.data.pagination.page}</span>
          <button
            disabled={!query.data.pagination.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border px-4 py-2 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
