import { useQuery } from "@tanstack/react-query";
import { AIInsightCard } from "@/features/ai/components/ai-insight-card.jsx";
import { getPlayerAIInsight } from "@/services/ai-insight.service.js";

export function PlayerAIInsightPanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-ai-insight", playerId, "30d"],
    queryFn: () => getPlayerAIInsight(playerId, { range: "30d" }),
    retry: 1,
  });

  if (query.isPending) {
    return (
      <div className="rounded-3xl border border-dashed border-violet-300 p-6 text-sm text-slate-500 dark:border-violet-500/30">
        Preparing verified-data performance insight…
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        AI performance insight is temporarily unavailable.
      </div>
    );
  }
  return <AIInsightCard insight={query.data.data} title="Player performance insight" />;
}
