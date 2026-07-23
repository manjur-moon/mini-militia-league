import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { PlayerAnalyticsPanel } from "@/features/analytics/components/player-analytics-panel.jsx";
import { PlayerRatingPanel } from "@/features/ratings/components/player-rating-panel.jsx";
import { getLinkedPlayerProfile } from "@/services/player.service.js";

export function PlayerPerformancePage() {
  const profileQuery = useQuery({
    queryKey: ["linked-player-profile-for-performance"],
    queryFn: getLinkedPlayerProfile,
  });

  if (profileQuery.isPending) return <LoadingState title="Loading linked player" />;
  if (profileQuery.isError) {
    return (
      <ErrorState
        title="Player profile is not linked"
        description={profileQuery.error.message}
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  const player = profileQuery.data.data.player;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Personal analytics"
        title={`${player.name} performance`}
        description="Your verified trends, rankings, records and improvement indicators."
        icon={BarChart3}
      />
      <PlayerRatingPanel playerId={player.playerId} />
      <PlayerAnalyticsPanel playerId={player.playerId} />
    </div>
  );
}
