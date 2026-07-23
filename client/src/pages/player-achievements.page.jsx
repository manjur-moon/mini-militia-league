import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { AchievementProgressCard } from "@/features/achievements/components/achievement-progress-card.jsx";
import { getPlayerAchievements } from "@/services/achievement.service.js";
import { getLinkedPlayerProfile } from "@/services/player.service.js";

export function PlayerAchievementsPage({ linked = false }) {
  const params = useParams();
  const linkedProfileQuery = useQuery({
    queryKey: ["linked-player-profile-for-achievements"],
    queryFn: getLinkedPlayerProfile,
    enabled: linked,
  });
  const playerId = linked
    ? linkedProfileQuery.data?.data?.player?.playerId
    : params.playerId;
  const achievementsQuery = useQuery({
    queryKey: ["player-achievements-page", playerId],
    queryFn: () => getPlayerAchievements(playerId),
    enabled: Boolean(playerId),
  });

  if ((linked && linkedProfileQuery.isPending) || achievementsQuery.isPending) {
    return <LoadingState title="Loading player achievements" />;
  }
  const error = linkedProfileQuery.error ?? achievementsQuery.error;
  if (error) {
    return (
      <ErrorState
        title="Achievements unavailable"
        description={error.message}
        onRetry={() => {
          linkedProfileQuery.refetch();
          achievementsQuery.refetch();
        }}
      />
    );
  }

  const result = achievementsQuery.data.data;
  return (
    <div
      className={
        linked ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-6 lg:px-8"
      }
    >
      <PageHeader
        eyebrow="Verified milestones"
        title={`${result.player.name}'s achievements`}
        description={`${result.summary.unlocked} unlocked · ${result.summary.locked} still in progress`}
        icon={Award}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.items.map((item) => (
          <AchievementProgressCard key={item.achievement.code} item={item} />
        ))}
      </div>
    </div>
  );
}
