import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { getPlayerAchievements } from "@/services/achievement.service.js";
import { AchievementProgressCard } from "./achievement-progress-card.jsx";

export function PlayerAchievementPanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-achievements", playerId],
    queryFn: () => getPlayerAchievements(playerId),
  });

  if (query.isPending) return <LoadingState title="Loading achievements" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Achievements unavailable"
        description={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const result = query.data.data;
  const unlocked = result.items.filter((item) => item.isUnlocked).slice(0, 6);
  const nearest = result.items
    .filter((item) => !item.isUnlocked)
    .sort(
      (left, right) =>
        Number(right.progress.percentage) - Number(left.progress.percentage),
    )
    .slice(0, Math.max(0, 6 - unlocked.length));
  const items = [...unlocked, ...nearest];

  return (
    <SectionCard
      title="Achievements"
      description={`${result.summary.unlocked} of ${result.summary.total} unlocked from verified performance`}
    >
      <div className="mb-5 flex justify-end">
        <Link
          to={`/players/${playerId}/achievements`}
          className="text-sm font-black text-amber-700 dark:text-amber-300"
        >
          View all achievements →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AchievementProgressCard key={item.achievement.code} item={item} />
        ))}
      </div>
    </SectionCard>
  );
}
