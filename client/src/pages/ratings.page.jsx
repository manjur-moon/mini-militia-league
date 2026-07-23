import { useQuery } from "@tanstack/react-query";
import { Gauge, ShieldCheck, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { RatingBreakdown } from "@/features/ratings/components/rating-breakdown.jsx";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";
import {
  getActiveRatingConfig,
  getRatingLeaderboard,
} from "@/services/rating.service.js";

const periodOptions = [
  { value: "all_time", label: "All time" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
];

export function RatingsPage() {
  const [periodType, setPeriodType] = useState("all_time");
  const [includeProvisional, setIncludeProvisional] = useState(false);
  const leaderboardQuery = useQuery({
    queryKey: ["rating-leaderboard", periodType, includeProvisional],
    queryFn: () =>
      getRatingLeaderboard({
        periodType,
        includeProvisional: String(includeProvisional),
        limit: 50,
      }),
  });
  const configQuery = useQuery({
    queryKey: ["active-rating-config"],
    queryFn: getActiveRatingConfig,
  });

  if (leaderboardQuery.isPending || configQuery.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <LoadingState title="Calculating verified player ratings" />
      </div>
    );
  }
  if (leaderboardQuery.isError || configQuery.isError) {
    const error = leaderboardQuery.error ?? configQuery.error;
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ErrorState
          title="Ratings unavailable"
          description={error.message}
          onRetry={() => {
            leaderboardQuery.refetch();
            configQuery.refetch();
          }}
        />
      </div>
    );
  }

  const entries = leaderboardQuery.data.data;
  const meta = leaderboardQuery.data.meta;
  const config = configQuery.data.data;
  const champion = entries[0] ?? null;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-slate-950 p-7 text-white hero-grid sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-300">
            Formula-versioned analytics
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Player ratings</h1>
          <p className="mt-4 text-slate-300">
            Attack, survival, consistency and activity are normalized to 0–100 from
            verified match data. New-player scores are confidence-adjusted until the
            minimum sample is met.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriodType(option.value)}
              className={`rounded-xl px-4 py-2 text-sm font-black ${periodType === option.value ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={includeProvisional}
            onChange={(event) => setIncludeProvisional(event.target.checked)}
          />
          Show provisional players
        </label>
      </div>

      {champion ? (
        <article className="rounded-[2rem] border border-amber-400/40 bg-amber-500/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <PlayerAvatar player={champion.player} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-slate-950">
                  <Trophy size={14} /> Rating leader
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-slate-900/70">
                  {champion.player.playerId}
                </span>
              </div>
              <Link
                to={`/players/${champion.player.playerId}`}
                className="mt-3 block text-3xl font-black hover:text-amber-700 dark:hover:text-amber-300"
              >
                {champion.player.name}
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                {champion.sampleSize} verified matches ·{" "}
                {Math.round(champion.confidenceFactor * 100)}% confidence
              </p>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-sm font-black uppercase tracking-wider text-slate-500">
                Overall
              </p>
              <p className="text-6xl font-black text-amber-600 dark:text-amber-300">
                {champion.ratings.overall.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <RatingBreakdown rating={champion} compact />
          </div>
        </article>
      ) : null}

      {!entries.length ? (
        <EmptyState
          icon={Gauge}
          title="No rating-eligible players"
          description="Verified matches and the configured minimum sample are required before official rating ranks appear."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Player</th>
                  <th className="px-5 py-4">Overall</th>
                  <th className="px-5 py-4">Attack</th>
                  <th className="px-5 py-4">Survival</th>
                  <th className="px-5 py-4">Consistency</th>
                  <th className="px-5 py-4">Activity</th>
                  <th className="px-5 py-4">Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-4 font-black">
                      {entry.rank ? `#${entry.rank}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/players/${entry.player.playerId}`}
                        className="font-black hover:text-amber-600"
                      >
                        {entry.player.name}
                      </Link>
                      <p className="text-xs text-slate-500">{entry.player.playerId}</p>
                    </td>
                    <td className="px-5 py-4 text-lg font-black text-amber-600 dark:text-amber-300">
                      {entry.ratings.overall.toFixed(1)}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {entry.ratings.attack.toFixed(1)}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {entry.ratings.survival.toFixed(1)}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {entry.ratings.consistency.toFixed(1)}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {entry.ratings.activity.toFixed(1)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${entry.minimumMatchesMet ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                      >
                        <ShieldCheck size={13} /> {entry.sampleSize}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black">Formula transparency</h2>
        <p className="mt-2 text-sm text-slate-500">
          {config.name} · {config.version} · minimum {config.minimumMatches} matches ·
          period {meta.period.label ?? meta.period.key}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {config.components.map((component) => (
            <div
              key={component.component}
              className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"
            >
              <p className="font-black capitalize">{component.component}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {component.metrics.map((metric) => (
                  <li key={metric.metric}>
                    {metric.metric} · {Math.round(metric.weight * 100)}% ·{" "}
                    {metric.method}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
