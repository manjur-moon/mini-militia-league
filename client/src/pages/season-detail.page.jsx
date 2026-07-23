import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Crosshair, Skull, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { SeasonStatusBadge } from "@/features/seasons/components/season-status-badge.jsx";
import {
  getSeasonLeaderboard,
  getSeasonStatistics,
} from "@/services/season.service.js";

export function SeasonDetailPage() {
  const { identifier } = useParams();
  const [metric, setMetric] = useState("overall");
  const statistics = useQuery({
    queryKey: ["season-statistics", identifier],
    queryFn: () => getSeasonStatistics(identifier),
  });
  const leaderboard = useQuery({
    queryKey: ["season-leaderboard", identifier, metric],
    queryFn: () => getSeasonLeaderboard(identifier, { metric, page: 1, limit: 100 }),
  });

  if (statistics.isPending) return <LoadingState title="Loading season" />;
  if (statistics.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          title="Season unavailable"
          description={statistics.error.message}
          onRetry={() => statistics.refetch()}
        />
      </div>
    );
  }

  const season = statistics.data.data.season;
  const totals = statistics.data.data.analytics.totals;
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Season profile"
        title={season.name}
        description={season.description || "Official verified season analytics."}
        icon={Trophy}
        actions={<SeasonStatusBadge status={season.status} />}
      />
      <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <CalendarDays size={17} /> {new Date(season.startAt).toLocaleDateString()} –{" "}
        {new Date(season.endAt).toLocaleDateString()} · {season.timezone}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Verified matches"
          value={totals.verifiedMatches}
          helper="Official season matches"
          icon={Activity}
        />
        <StatCard
          label="Players"
          value={totals.participatingPlayers}
          helper="Season participants"
          icon={Users}
        />
        <StatCard
          label="Kills"
          value={totals.totalKills}
          helper="Verified eliminations"
          icon={Crosshair}
        />
        <StatCard
          label="Deaths"
          value={totals.totalDeaths}
          helper="Verified deaths"
          icon={Skull}
        />
      </div>
      <SectionCard
        title="Season leaderboard"
        description="Minimum-match rules and deterministic tie-breakers are applied"
      >
        <div className="mb-5 max-w-xs">
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="overall">Overall</option>
            <option value="kills">Kills</option>
            <option value="kdr">KDR</option>
            <option value="activity">Activity</option>
            <option value="first_places">First places</option>
            <option value="win_rate">Win rate</option>
          </select>
        </div>
        {leaderboard.isPending ? <LoadingState title="Loading leaderboard" /> : null}
        {leaderboard.isError ? (
          <ErrorState
            title="Leaderboard unavailable"
            description={leaderboard.error.message}
            onRetry={() => leaderboard.refetch()}
          />
        ) : null}
        {leaderboard.data ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Matches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {leaderboard.data.data.map((entry) => (
                  <tr key={entry.player.id}>
                    <td className="p-3 text-lg font-black">#{entry.rank}</td>
                    <td className="p-3">
                      <p className="font-black">{entry.player.name}</p>
                      <p className="text-xs text-slate-500">{entry.player.playerId}</p>
                    </td>
                    <td className="p-3 font-black">{entry.value}</td>
                    <td className="p-3">{entry.metrics.matchesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>
    </section>
  );
}
