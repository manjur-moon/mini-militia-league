import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { HallOfFameRecordCard } from "@/features/hall-of-fame/components/hall-of-fame-record-card.jsx";
import { getPlayerHallOfFame } from "@/services/hall-of-fame.service.js";
import { getLinkedPlayerProfile } from "@/services/player.service.js";

export function PlayerHallOfFamePage({ linked = false }) {
  const params = useParams();
  const linkedProfileQuery = useQuery({
    queryKey: ["linked-player-profile-for-hall-of-fame"],
    queryFn: getLinkedPlayerProfile,
    enabled: linked,
  });
  const playerId = linked
    ? linkedProfileQuery.data?.data?.player?.playerId
    : params.playerId;
  const query = useQuery({
    queryKey: ["player-hall-of-fame", playerId],
    queryFn: () => getPlayerHallOfFame(playerId, { status: "all", limit: 100 }),
    enabled: Boolean(playerId),
  });

  if ((linked && linkedProfileQuery.isPending) || query.isPending) {
    return <LoadingState title="Loading Hall of Fame history" />;
  }
  const error = linkedProfileQuery.error ?? query.error;
  if (error) {
    return (
      <ErrorState
        title="Hall of Fame unavailable"
        description={error.message}
        onRetry={() => {
          linkedProfileQuery.refetch();
          query.refetch();
        }}
      />
    );
  }

  const result = query.data.data;
  return (
    <div
      className={
        linked ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-6 lg:px-8"
      }
    >
      <PageHeader
        eyebrow="Record archive"
        title={`${result.player.name}'s Hall of Fame history`}
        description={`${result.items.length} current or historical league record snapshots`}
        icon={Crown}
      />
      {result.items.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((record) => (
            <HallOfFameRecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Hall of Fame records"
          description="This player has not held a Hall of Fame record yet."
        />
      )}
    </div>
  );
}
