import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  Crosshair,
  Crown,
  Medal,
  ShieldCheck,
  Skull,
  Target,
  Trophy,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { PlayerAnalyticsPanel } from "@/features/analytics/components/player-analytics-panel.jsx";
import { PlayerAIInsightPanel } from "@/features/ai/components/player-ai-insight-panel.jsx";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";
import { PlayerRatingPanel } from "@/features/ratings/components/player-rating-panel.jsx";
import { PlayerAchievementPanel } from "@/features/achievements/components/player-achievement-panel.jsx";
import { PlayerTitlePanel } from "@/features/titles/components/player-title-panel.jsx";
import { PlayerRivalryPanel } from "@/features/rivalries/components/player-rivalry-panel.jsx";
import { PlayerChallengePanel } from "@/features/challenges/components/player-challenge-panel.jsx";
import { PlayerHallOfFamePanel } from "@/features/hall-of-fame/components/player-hall-of-fame-panel.jsx";
import { PlayerProfileSharePanel } from "@/features/sharing/components/player-profile-share-panel.jsx";
import {
  getLinkedPlayerProfile,
  getPlayerProfile,
} from "@/services/player.service.js";

function formatNumber(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

function RecordCard({ label, value, suffix = "", matchId }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">
        {value ?? 0}
        {suffix}
      </p>
      {matchId ? (
        <Link
          to={`/matches/${matchId}`}
          className="mt-3 inline-block text-sm font-bold text-amber-700 dark:text-amber-300"
        >
          View evidence
        </Link>
      ) : null}
    </article>
  );
}

export function PlayerProfilePage({ linked = false }) {
  const { playerId } = useParams();
  const profileQuery = useQuery({
    queryKey: linked ? ["linked-player-profile"] : ["player-profile", playerId],
    queryFn: linked ? getLinkedPlayerProfile : () => getPlayerProfile(playerId),
    enabled: linked || Boolean(playerId),
  });

  if (profileQuery.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <LoadingState title="Loading player profile" />
      </div>
    );
  }
  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ErrorState
          title="Player profile unavailable"
          description={profileQuery.error.message}
          onRetry={() => profileQuery.refetch()}
        />
      </div>
    );
  }

  const { player, statistics, recentMatches = [] } = profileQuery.data.data;
  const metrics = statistics?.metrics;
  const records = statistics?.records;

  return (
    <section
      className={
        linked
          ? "space-y-8"
          : "mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8"
      }
    >
      {!linked ? (
        <Link to="/players" className="font-bold text-amber-700 dark:text-amber-300">
          ← Back to players
        </Link>
      ) : null}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="h-28 bg-slate-950 hero-grid" />
        <div className="p-6 sm:p-8">
          <div className="-mt-20 flex flex-col gap-5 sm:flex-row sm:items-end">
            <PlayerAvatar player={player} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-slate-950">
                  {player.playerId}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black capitalize text-emerald-700 dark:text-emerald-300">
                  {player.status}
                </span>
                {statistics?.globalRank ? (
                  <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-black text-indigo-700 dark:text-indigo-300">
                    Global #{statistics.globalRank}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">{player.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-500">
                <CalendarDays size={17} /> Joined{" "}
                {new Date(player.joinDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/players/${player.playerId}/card`}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950"
              >
                View player card
              </Link>
              <Link
                to={`/players/${player.playerId}/matches`}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950"
              >
                Full match history
              </Link>
            </div>
          </div>
          {player.aliases.length ? (
            <p className="mt-6 text-sm text-slate-500">
              Known aliases: {player.aliases.join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      <PlayerProfileSharePanel playerId={player.playerId} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Verified matches"
          value={metrics?.matchesPlayed ?? 0}
          icon={ShieldCheck}
        />
        <StatCard
          label="Total kills"
          value={metrics?.totalKills ?? 0}
          icon={Crosshair}
        />
        <StatCard label="Total deaths" value={metrics?.totalDeaths ?? 0} icon={Skull} />
        <StatCard label="KDR" value={formatNumber(metrics?.kdr)} icon={Activity} />
        <StatCard
          label="Win rate"
          value={`${formatNumber(metrics?.winRate)}%`}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Average kills"
          value={formatNumber(metrics?.averageKills)}
          icon={Target}
        />
        <StatCard
          label="Average deaths"
          value={formatNumber(metrics?.averageDeaths)}
          icon={Skull}
        />
        <StatCard
          label="Average rank"
          value={formatNumber(metrics?.averageRank)}
          icon={Medal}
        />
        <StatCard
          label="First places"
          value={metrics?.firstPlaceCount ?? 0}
          icon={Crown}
        />
        <StatCard
          label="Last places"
          value={metrics?.lastPlaceCount ?? 0}
          icon={ShieldCheck}
        />
      </div>

      {!statistics ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <h2 className="text-xl font-black">No verified statistics yet</h2>
          <p className="mt-2 text-slate-500">
            Statistics will be generated after this player appears in a verified match.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Personal records
              </p>
              <h2 className="mt-2 text-2xl font-black">Verified performance peaks</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <RecordCard
                label="Highest kills in one match"
                value={records?.highestKills?.value ?? 0}
                matchId={records?.highestKills?.matchId}
              />
              <RecordCard
                label="Highest deaths in one match"
                value={records?.highestDeaths?.value ?? 0}
                matchId={records?.highestDeaths?.matchId}
              />
              <RecordCard
                label="Best match KDR"
                value={formatNumber(records?.bestKdr?.value)}
                matchId={records?.bestKdr?.matchId}
              />
              <RecordCard
                label="Longest first-place streak"
                value={records?.longestFirstPlaceStreak ?? 0}
              />
            </div>
            <p className="text-xs text-slate-500">
              Calculation version: {statistics.calculationVersion ?? "Unavailable"} ·
              Last recalculated {new Date(statistics.recalculatedAt).toLocaleString()}
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Recent evidence
                </p>
                <h2 className="mt-2 text-2xl font-black">Latest verified matches</h2>
              </div>
              <Link
                to={`/players/${player.playerId}/matches`}
                className="font-bold text-amber-700 dark:text-amber-300"
              >
                View all matches →
              </Link>
            </div>
            {recentMatches.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentMatches.map((item) => (
                  <Link
                    key={item.match.id}
                    to={`/matches/${item.match.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-amber-400 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <img
                      src={item.match.screenshot.secureUrl}
                      alt={item.match.matchCode}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      <div className="flex justify-between gap-3">
                        <p className="font-black">{item.match.matchCode}</p>
                        <span className="font-black">#{item.placement}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {item.kills} kills · {item.deaths} deaths ·{" "}
                        {formatNumber(item.kdr)} KDR
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed p-6 text-slate-500">
                No verified match evidence is available yet.
              </p>
            )}
          </section>

          <PlayerAchievementPanel playerId={player.playerId} />

          <PlayerTitlePanel playerId={player.playerId} />

          <PlayerRivalryPanel playerId={player.playerId} />

          <PlayerChallengePanel playerId={player.playerId} />

          <PlayerHallOfFamePanel playerId={player.playerId} />

          <PlayerRatingPanel playerId={player.playerId} />

          <PlayerAIInsightPanel playerId={player.playerId} />

          <PlayerAnalyticsPanel playerId={player.playerId} />
        </>
      )}
    </section>
  );
}
