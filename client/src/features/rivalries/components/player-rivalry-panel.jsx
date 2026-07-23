import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { getPlayerRivalries } from "@/services/rivalry.service.js";
import { RivalrySummaryCard } from "./rivalry-summary-card.jsx";

export function PlayerRivalryPanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-rivalries", playerId, "all_time"],
    queryFn: () => getPlayerRivalries(playerId, { limit: 3 }),
  });

  if (query.isPending) return <LoadingState title="Loading rivalries" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Rivalries unavailable"
        description={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <SectionCard
      title="Rivalry profile"
      description="Head-to-head comparisons from shared verified matches"
    >
      <div className="mb-5 flex justify-end">
        <Link
          to={`/players/${playerId}/rivalries`}
          className="text-sm font-black text-amber-700 dark:text-amber-300"
        >
          View all rivalries →
        </Link>
      </div>
      {query.data.data.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.data.map((rivalry) => (
            <RivalrySummaryCard
              key={rivalry.pairKey}
              rivalry={rivalry}
              playerId={playerId}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500 dark:border-slate-700">
          No shared verified matches are available for rivalry analysis yet.
        </p>
      )}
    </SectionCard>
  );
}
