import { useQuery } from "@tanstack/react-query";
import { Activity, Crosshair, Link2, Medal, Skull, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { authClient } from "@/lib/auth-client.js";
import {
  getLinkedPlayerMatches,
  getLinkedPlayerProfile,
} from "@/services/player.service.js";

export function PlayerDashboardPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isLinked = Boolean(user?.linkedPlayerId);
  const profileQuery = useQuery({
    queryKey: ["linked-player-profile"],
    queryFn: getLinkedPlayerProfile,
    enabled: isLinked,
  });
  const matchesQuery = useQuery({
    queryKey: ["linked-player-matches"],
    queryFn: () => getLinkedPlayerMatches({ page: 1, limit: 5 }),
    enabled: isLinked,
  });
  const profile = profileQuery.data?.data;
  const metrics = profile?.statistics?.metrics;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Player overview"
        title={`Welcome, ${user?.name ?? "Player"}`}
        description="Your dashboard is powered only by verified Mini Militia result screenshots."
        icon={Trophy}
        action={
          profile?.player ? (
            <Link
              to={`/players/${profile.player.playerId}`}
              className="rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950"
            >
              Public profile
            </Link>
          ) : null
        }
      />

      {!isLinked ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-500/10">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950">
            <Link2 size={21} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-black">Player profile is not linked</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900/70 dark:text-amber-200/70">
              An administrator must link this account to an official player before
              personal statistics can appear.
            </p>
          </div>
        </section>
      ) : null}

      {profileQuery.isPending && isLinked ? (
        <LoadingState title="Loading personal statistics" />
      ) : null}
      {profileQuery.isError ? (
        <ErrorState
          description={profileQuery.error.message}
          onRetry={() => profileQuery.refetch()}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Matches played"
          value={metrics?.matchesPlayed ?? 0}
          helper="Verified matches only"
          icon={Activity}
        />
        <StatCard
          label="Total kills"
          value={metrics?.totalKills ?? 0}
          helper="Official career total"
          icon={Crosshair}
        />
        <StatCard
          label="Total deaths"
          value={metrics?.totalDeaths ?? 0}
          helper="Official career total"
          icon={Skull}
        />
        <StatCard
          label="Global rank"
          value={profile?.statistics?.globalRank ?? "—"}
          helper="All-time verified rank"
          icon={Medal}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Performance summary" description="Official career metrics">
          {profile?.statistics ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["KDR", Number(metrics.kdr).toFixed(2)],
                ["Average kills", Number(metrics.averageKills).toFixed(2)],
                ["Average deaths", Number(metrics.averageDeaths).toFixed(2)],
                ["Average rank", Number(metrics.averageRank).toFixed(2)],
                ["Win rate", `${Number(metrics.winRate).toFixed(2)}%`],
                ["First places", metrics.firstPlaceCount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60"
                >
                  <p className="text-sm font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No verified statistics"
              description="Statistics appear after your first verified match."
            />
          )}
        </SectionCard>
        <SectionCard title="Recent matches" description="Latest verified results">
          {matchesQuery.isPending && isLinked ? (
            <LoadingState title="Loading recent matches" />
          ) : null}
          {matchesQuery.data?.data?.length ? (
            <div className="grid gap-3">
              {matchesQuery.data.data.map((item) => (
                <Link
                  key={item.match.id}
                  to={`/matches/${item.match.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-amber-400 dark:border-slate-800"
                >
                  <div>
                    <p className="font-black">{item.match.matchCode}</p>
                    <p className="text-xs text-slate-500">
                      {item.kills} kills · {item.deaths} deaths · {item.kdr.toFixed(2)}{" "}
                      KDR
                    </p>
                  </div>
                  <span className="font-black">#{item.placement}</span>
                </Link>
              ))}
            </div>
          ) : null}
          {matchesQuery.data && !matchesQuery.data.data.length ? (
            <EmptyState
              title="No verified matches"
              description="Your recent matches will appear after moderator verification."
            />
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
