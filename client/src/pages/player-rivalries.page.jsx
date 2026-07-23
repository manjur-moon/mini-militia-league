import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { RivalrySummaryCard } from "@/features/rivalries/components/rivalry-summary-card.jsx";
import { getPlayerRivalries } from "@/services/rivalry.service.js";

export function PlayerRivalriesPage() {
  const { playerId } = useParams();
  const [periodType, setPeriodType] = useState("all_time");
  const query = useQuery({
    queryKey: ["player-rivalries", playerId, periodType],
    queryFn: () => getPlayerRivalries(playerId, { periodType, limit: 50 }),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <LoadingState title="Loading player rivalries" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          title="Player rivalries unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to={`/players/${playerId}`}
        className="font-bold text-amber-700 dark:text-amber-300"
      >
        ← Back to player profile
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Head-to-head profile
          </p>
          <h1 className="mt-2 text-4xl font-black">
            {query.data.meta.player.name} rivalries
          </h1>
          <p className="mt-3 text-slate-500">{query.data.meta.period.label}</p>
        </div>
        <select
          value={periodType}
          onChange={(event) => setPeriodType(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all_time">All time</option>
          <option value="weekly">This week</option>
          <option value="monthly">This month</option>
        </select>
      </div>
      {query.data.data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.data.map((rivalry) => (
            <RivalrySummaryCard
              key={rivalry.pairKey}
              rivalry={rivalry}
              playerId={playerId}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
          No shared verified matches were found in this period.
        </p>
      )}
    </section>
  );
}
