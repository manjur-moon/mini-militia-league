import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { ChallengeProgressCard } from "@/features/challenges/components/challenge-progress-card.jsx";
import { getPlayerChallenges } from "@/services/challenge.service.js";
import { getLinkedPlayerProfile } from "@/services/player.service.js";

export function PlayerChallengesPage({ linked = false }) {
  const params = useParams();
  const linkedProfileQuery = useQuery({
    queryKey: ["linked-player-profile-for-challenges"],
    queryFn: getLinkedPlayerProfile,
    enabled: linked,
  });
  const playerId = linked
    ? linkedProfileQuery.data?.data?.player?.playerId
    : params.playerId;
  const challengesQuery = useQuery({
    queryKey: ["player-challenges-page", playerId],
    queryFn: () => getPlayerChallenges(playerId, { lifecycle: "all" }),
    enabled: Boolean(playerId),
  });

  if ((linked && linkedProfileQuery.isPending) || challengesQuery.isPending) {
    return <LoadingState title="Loading player challenges" />;
  }
  const error = linkedProfileQuery.error ?? challengesQuery.error;
  if (error) {
    return (
      <ErrorState
        title="Challenges unavailable"
        description={error.message}
        onRetry={() => {
          linkedProfileQuery.refetch();
          challengesQuery.refetch();
        }}
      />
    );
  }

  const result = challengesQuery.data.data;
  return (
    <div
      className={
        linked ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-6 lg:px-8"
      }
    >
      <PageHeader
        eyebrow="Verified progress"
        title={`${result.player.name}'s challenges`}
        description={`${result.summary.completed} completed · ${result.summary.inProgress} in progress · ${result.summary.expired} expired`}
        icon={Target}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.items.map((item) => (
          <ChallengeProgressCard
            key={`${item.challengeCode}-${item.challengeVersion}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
