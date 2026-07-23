import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { RatingBreakdown } from "@/features/ratings/components/rating-breakdown.jsx";
import { getPlayerRating } from "@/services/rating.service.js";

export function PlayerRatingPanel({ playerId, periodType = "all_time" }) {
  const ratingQuery = useQuery({
    queryKey: ["player-rating", playerId, periodType],
    queryFn: () => getPlayerRating(playerId, { periodType }),
    enabled: Boolean(playerId),
  });

  if (ratingQuery.isPending) return <LoadingState title="Calculating player rating" />;
  if (ratingQuery.isError) {
    return (
      <ErrorState
        title="Rating unavailable"
        description={ratingQuery.error.message}
        onRetry={() => ratingQuery.refetch()}
      />
    );
  }

  const { rating, period, formulaVersion } = ratingQuery.data.data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Verified rating
          </p>
          <h2 className="mt-2 text-2xl font-black">Player rating profile</h2>
        </div>
        {rating ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={14} />{" "}
            {rating.minimumMatchesMet ? "Rank eligible" : "Provisional"}
          </span>
        ) : null}
      </div>
      <RatingBreakdown rating={rating} />
      {rating ? (
        <p className="text-xs text-slate-500">
          {period.label ?? period.key} · Rank{" "}
          {rating.rank ? `#${rating.rank}` : "pending minimum matches"} ·{" "}
          {rating.sampleSize} verified matches · confidence{" "}
          {Math.round(rating.confidenceFactor * 100)}% · formula {formulaVersion}
        </p>
      ) : null}
    </section>
  );
}
