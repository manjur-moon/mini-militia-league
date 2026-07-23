import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Crosshair,
  Crown,
  Skull,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { getPeriodAnalytics } from "@/services/analytics.service.js";
import { getCurrentMvp } from "@/services/mvp.service.js";

export function AnalyticsPage() {
  const [periodType, setPeriodType] = useState("weekly");
  const [date, setDate] = useState("");
  const analyticsQuery = useQuery({
    queryKey: ["period-analytics", periodType, date],
    queryFn: () => getPeriodAnalytics(periodType, date ? { date } : {}),
  });
  const mvpQuery = useQuery({
    queryKey: ["current-mvp", periodType, date],
    queryFn: () => getCurrentMvp({ awardType: periodType, ...(date ? { date } : {}) }),
  });

  if (analyticsQuery.isPending || mvpQuery.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <LoadingState title="Loading league analytics" />
      </div>
    );
  }
  if (analyticsQuery.isError || mvpQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          description={analyticsQuery.error?.message ?? mvpQuery.error?.message}
          onRetry={() => {
            analyticsQuery.refetch();
            mvpQuery.refetch();
          }}
        />
      </div>
    );
  }

  const analytics = analyticsQuery.data.data;
  const award = mvpQuery.data.data.award;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            Periodic intelligence
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">League analytics</h1>
          <p className="mt-4 text-lg text-slate-500">
            Compare verified weekly and monthly performance across the league.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["weekly", "monthly"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriodType(value)}
              className={`rounded-xl px-4 py-2 font-black capitalize ${periodType === value ? "bg-amber-500 text-slate-950" : "border border-slate-300 dark:border-slate-700"}`}
            >
              {value}
            </button>
          ))}
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Verified matches"
          value={analytics.totals.verifiedMatches}
          icon={Trophy}
        />
        <StatCard
          label="Players"
          value={analytics.totals.participatingPlayers}
          icon={Users}
        />
        <StatCard label="Kills" value={analytics.totals.totalKills} icon={Crosshair} />
        <StatCard label="Deaths" value={analytics.totals.totalDeaths} icon={Skull} />
        <StatCard
          label="League KDR"
          value={Number(analytics.totals.leagueKdr).toFixed(2)}
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl bg-slate-950 p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
            {analytics.period.label} MVP
          </p>
          {award ? (
            <div className="mt-5 flex items-center gap-5">
              <div className="grid size-24 place-items-center overflow-hidden rounded-3xl bg-amber-500 text-4xl font-black text-slate-950">
                {award.player?.photoUrl ? (
                  <img
                    src={award.player.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  award.player?.name?.slice(0, 1)
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black">{award.player?.name}</h2>
                <p className="mt-2 text-slate-300">
                  {award.player?.playerId} · Score {Number(award.score).toFixed(2)}
                </p>
                {award.stale ? (
                  <p className="mt-2 text-sm font-bold text-amber-300">
                    Locked historical award; admin recalculation required.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-slate-300">
              No player has met the minimum-match requirement.
            </p>
          )}
          <Link
            to="/mvp"
            className="mt-6 inline-flex items-center gap-2 font-black text-amber-400"
          >
            View MVP details <Crown size={18} />
          </Link>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Top three
          </p>
          <div className="mt-5 grid gap-3">
            {analytics.topPlayers.map((entry) => (
              <Link
                key={entry.player.id}
                to={`/players/${entry.player.playerId}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-amber-400 dark:border-slate-800"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 font-black">
                    #{entry.rank}
                  </span>
                  <strong>{entry.player.name}</strong>
                </span>
                <span className="font-black">{entry.performanceScore.toFixed(2)}</span>
              </Link>
            ))}
            {!analytics.topPlayers.length ? (
              <p className="text-slate-500">No eligible players in this period.</p>
            ) : null}
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-emerald-500" />
          <h2 className="text-2xl font-black">Most improved player</h2>
        </div>
        {analytics.mostImproved ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-black">{analytics.mostImproved.player.name}</p>
              <p className="text-sm text-slate-500">
                {analytics.mostImproved.matchesPlayed} verified matches
              </p>
            </div>
            <p className="text-3xl font-black text-emerald-600">
              +{analytics.mostImproved.improvementRate.toFixed(2)}%
            </p>
          </div>
        ) : (
          <p className="mt-4 text-slate-500">
            Both current and previous periods require the configured minimum number of
            matches.
          </p>
        )}
      </article>
    </section>
  );
}
