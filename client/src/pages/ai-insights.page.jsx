import { useQuery } from "@tanstack/react-query";
import { Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { AIInsightCard } from "@/features/ai/components/ai-insight-card.jsx";
import {
  getAIStatus,
  getPeriodAIHighlight,
  getPeriodAISummary,
} from "@/services/ai-insight.service.js";

export function AIInsightsPage() {
  const [periodType, setPeriodType] = useState("weekly");
  const statusQuery = useQuery({ queryKey: ["ai-status"], queryFn: getAIStatus });
  const summaryQuery = useQuery({
    queryKey: ["ai-period-summary", periodType],
    queryFn: () => getPeriodAISummary(periodType),
    retry: 1,
  });
  const highlightQuery = useQuery({
    queryKey: ["ai-period-highlight", periodType],
    queryFn: () => getPeriodAIHighlight(periodType),
    retry: 1,
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Verified-data narratives"
        title="AI summaries and league insights"
        description="Narratives use verified structured statistics only. A deterministic statistics summary is shown whenever an external AI provider is unavailable."
        icon={Bot}
      />

      <div className="flex flex-wrap items-center gap-3">
        {["weekly", "monthly"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPeriodType(type)}
            className={`rounded-xl px-4 py-2.5 text-sm font-black capitalize ${
              periodType === type
                ? "bg-violet-600 text-white"
                : "border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            {type}
          </button>
        ))}
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {statusQuery.data?.data?.externalGenerationConfigured
            ? `${statusQuery.data.data.model} configured`
            : "Deterministic fallback active"}
        </span>
      </div>

      {summaryQuery.isPending ? (
        <LoadingState title="Preparing league summary" />
      ) : summaryQuery.isError ? (
        <ErrorState
          title="League summary unavailable"
          description={summaryQuery.error.message}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <AIInsightCard
          insight={summaryQuery.data.data}
          title={`${periodType} AI summary`}
        />
      )}

      {highlightQuery.isPending ? null : highlightQuery.isError ? null : (
        <AIInsightCard
          insight={highlightQuery.data.data}
          title={`${periodType} auto highlight`}
          compact
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 text-violet-300" size={22} />
          <div>
            <h2 className="text-xl font-black">Official-data boundary</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              AI output never verifies matches, edits statistics, changes rankings or
              grants awards. It only describes already-verified structured data and is
              stored with its source range, prompt version and generation timestamp.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
