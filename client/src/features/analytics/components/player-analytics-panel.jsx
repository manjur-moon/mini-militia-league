import { useQuery } from "@tanstack/react-query";
import { Activity, Crosshair, Gauge, Medal, TrendingUp, Trophy } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import {
  getPlayerAdvancedAnalytics,
  getPlayerPerformance,
} from "@/services/analytics.service.js";

const PerformanceTrendChart = lazy(() => import("./performance-trend-chart.jsx"));

function MatchPeak({ title, match }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      {match ? (
        <>
          <p className="mt-2 text-2xl font-black">
            {match.performanceScore.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {match.kills} kills · {match.deaths} deaths · rank #{match.placement}
          </p>
          <Link
            to={`/matches/${match.matchId}`}
            className="mt-3 inline-block text-sm font-black text-amber-700 dark:text-amber-300"
          >
            View {match.matchCode}
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No verified match data.</p>
      )}
    </article>
  );
}

export function PlayerAnalyticsPanel({ playerId }) {
  const [range, setRange] = useState("30d");
  const performanceQuery = useQuery({
    queryKey: ["player-performance", playerId, range],
    queryFn: () => getPlayerPerformance(playerId, { range }),
    enabled: Boolean(playerId),
  });
  const advancedQuery = useQuery({
    queryKey: ["player-advanced-analytics", playerId],
    queryFn: () => getPlayerAdvancedAnalytics(playerId),
    enabled: Boolean(playerId),
  });

  if (performanceQuery.isPending || advancedQuery.isPending) {
    return <LoadingState title="Loading performance analytics" />;
  }
  if (performanceQuery.isError || advancedQuery.isError) {
    return (
      <ErrorState
        title="Performance analytics unavailable"
        description={performanceQuery.error?.message ?? advancedQuery.error?.message}
        onRetry={() => {
          performanceQuery.refetch();
          advancedQuery.refetch();
        }}
      />
    );
  }

  const performance = performanceQuery.data.data;
  const advanced = advancedQuery.data.data;

  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Performance trend
            </p>
            <h2 className="mt-2 text-2xl font-black">Verified daily analytics</h2>
          </div>
          <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
            {["7d", "30d"].map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setRange(option)}
                className={`rounded-lg px-4 py-2 text-sm font-black ${range === option ? "bg-amber-500 text-slate-950" : "text-slate-500"}`}
              >
                {option === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        </div>
        {performance.trend.length ? (
          <div className="mt-6">
            <Suspense fallback={<LoadingState title="Loading chart" />}>
              <PerformanceTrendChart data={performance.trend} />
            </Suspense>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="No trend data"
              description="Verified matches in this date range will appear here."
            />
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Global rank"
          value={performance.rankings.global ? `#${performance.rankings.global}` : "—"}
          icon={Trophy}
        />
        <StatCard
          label="Weekly rank"
          value={performance.rankings.weekly ? `#${performance.rankings.weekly}` : "—"}
          icon={TrendingUp}
        />
        <StatCard
          label="Monthly rank"
          value={
            performance.rankings.monthly ? `#${performance.rankings.monthly}` : "—"
          }
          icon={Medal}
        />
        <StatCard
          label="Season rank"
          value={performance.rankings.season ? `#${performance.rankings.season}` : "—"}
          icon={Gauge}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kill efficiency"
          value={`${advanced.killEfficiency.toFixed(2)}%`}
          icon={Crosshair}
        />
        <StatCard
          label="Consistency"
          value={advanced.consistencyScore.toFixed(2)}
          icon={Activity}
        />
        <StatCard
          label="30-day improvement"
          value={
            advanced.improvement.improvementRate === null
              ? "Insufficient data"
              : `${advanced.improvement.improvementRate.toFixed(2)}%`
          }
          icon={TrendingUp}
        />
        <StatCard label="Formula" value={advanced.formulaVersion} icon={Gauge} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MatchPeak title="Best verified match" match={advanced.bestMatch} />
        <MatchPeak title="Worst verified match" match={advanced.worstMatch} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500">Most active day</p>
          <p className="mt-2 text-2xl font-black">
            {advanced.mostActiveDay?.matchesPlayed ?? 0} matches
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {advanced.mostActiveDay?.dateKey ?? "No data"}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500">Best week</p>
          <p className="mt-2 text-2xl font-black">
            {advanced.bestWeek?.averagePerformanceScore?.toFixed(2) ?? "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {advanced.bestWeek?.periodKey ?? "Minimum sample not met"}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500">Best month</p>
          <p className="mt-2 text-2xl font-black">
            {advanced.bestMonth?.averagePerformanceScore?.toFixed(2) ?? "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {advanced.bestMonth?.periodKey ?? "Minimum sample not met"}
          </p>
        </article>
      </div>
    </div>
  );
}
