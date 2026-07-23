import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { HallOfFameRecordCard } from "./hall-of-fame-record-card.jsx";
import { getPlayerHallOfFame } from "@/services/hall-of-fame.service.js";

export function PlayerHallOfFamePanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-hall-of-fame-panel", playerId],
    queryFn: () => getPlayerHallOfFame(playerId, { status: "all", limit: 3 }),
    enabled: Boolean(playerId),
  });

  if (query.isPending) return <LoadingState title="Loading Hall of Fame records" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Hall of Fame unavailable"
        description={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const result = query.data.data;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            <Crown size={17} /> Hall of Fame
          </p>
          <h2 className="mt-2 text-2xl font-black">Historical league records</h2>
        </div>
        <Link
          to={`/players/${playerId}/hall-of-fame`}
          className="font-bold text-amber-700 dark:text-amber-300"
        >
          View record history →
        </Link>
      </div>
      {result.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((record) => (
            <HallOfFameRecordCard key={record.id} record={record} compact />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500 dark:border-slate-700">
          This player has not entered the Hall of Fame yet.
        </p>
      )}
    </section>
  );
}
