import { useQuery } from "@tanstack/react-query";
import { Medal, Target, Trophy } from "lucide-react";
import { useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { ChallengeProgressCard } from "@/features/challenges/components/challenge-progress-card.jsx";
import { getChallenge } from "@/services/challenge.service.js";

export function ChallengeDetailPage() {
  const { challengeCode } = useParams();
  const query = useQuery({
    queryKey: ["challenge", challengeCode],
    queryFn: () => getChallenge(challengeCode),
  });
  if (query.isPending) return <LoadingState title="Loading challenge" />;
  if (query.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14">
        <ErrorState
          title="Challenge unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }
  const { challenge, leaderboard } = query.data.data;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`${challenge.type} mission`}
        title={challenge.name}
        description={challenge.description}
        icon={Target}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <ChallengeProgressCard item={challenge} showLink={false} />
          <SectionCard title="Reward" description="Granted after verified completion">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{challenge.reward.badgeIcon}</span>
              <div>
                <p className="font-black">{challenge.reward.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {challenge.reward.description}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
        <SectionCard
          title="Challenge leaderboard"
          description="Top progress from official verified statistics"
        >
          {leaderboard.length ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {leaderboard.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 font-black text-amber-700 dark:text-amber-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">
                      {item.player?.name ?? "League player"}
                    </p>
                    <p className="text-xs text-slate-500">{item.player?.playerId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{item.progressPercentage.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">
                      {item.currentValue} / {item.targetValue}
                    </p>
                  </div>
                  {item.status === "completed" ? (
                    <Trophy size={18} className="text-amber-500" />
                  ) : (
                    <Medal size={18} className="text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
              No player progress has been recorded yet.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
