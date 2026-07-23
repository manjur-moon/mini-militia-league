import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { getPlayerChallenges } from "@/services/challenge.service.js";
import { ChallengeProgressCard } from "./challenge-progress-card.jsx";

export function PlayerChallengePanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-challenges-panel", playerId],
    queryFn: () => getPlayerChallenges(playerId, { lifecycle: "all" }),
  });

  if (query.isPending) return <LoadingState title="Loading challenges" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Challenges unavailable"
        description={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const items = [...query.data.data.items]
    .sort((a, b) => {
      const rank = { in_progress: 0, completed: 1, expired: 2 };
      return (
        rank[a.status] - rank[b.status] || b.progressPercentage - a.progressPercentage
      );
    })
    .slice(0, 3);

  return (
    <SectionCard
      title="Challenges"
      description="Weekly and monthly goals calculated from verified matches"
    >
      <div className="mb-5 flex justify-end">
        <Link
          to={`/players/${playerId}/challenges`}
          className="text-sm font-black text-amber-700 dark:text-amber-300"
        >
          View challenge history →
        </Link>
      </div>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ChallengeProgressCard
              key={`${item.challengeCode}-${item.challengeVersion}`}
              item={item}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500 dark:border-slate-700">
          No challenge progress is available yet.
        </p>
      )}
    </SectionCard>
  );
}
