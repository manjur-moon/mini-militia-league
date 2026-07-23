import { useQuery } from "@tanstack/react-query";
import { AIInsightCard } from "@/features/ai/components/ai-insight-card.jsx";
import { getMatchAIInsight } from "@/services/ai-insight.service.js";

export function MatchAIInsightPanel({ matchId }) {
  const query = useQuery({
    queryKey: ["match-ai-insight", matchId],
    queryFn: () => getMatchAIInsight(matchId),
    retry: 1,
  });

  if (query.isPending) {
    return (
      <div className="rounded-3xl border border-dashed border-violet-300 p-6 text-sm text-slate-500 dark:border-violet-500/30">
        Preparing verified-scoreboard insight…
      </div>
    );
  }
  if (query.isError) return null;
  return <AIInsightCard insight={query.data.data} title="Verified match insight" />;
}
