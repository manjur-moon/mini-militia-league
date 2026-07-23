import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CircleAlert,
  Clock3,
  Crown,
  RefreshCcw,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { getPeriodAnalytics } from "@/services/analytics.service.js";
import { getMatches } from "@/services/match.service.js";
import { getCurrentMvp } from "@/services/mvp.service.js";
import { getPlayers } from "@/services/player.service.js";
import {
  getStatisticsOverview,
  recalculateStatistics,
} from "@/services/statistics.service.js";

async function getDashboardData() {
  const [
    overview,
    activePlayers,
    inactivePlayers,
    pending,
    failed,
    recent,
    weekly,
    monthly,
    mvp,
  ] = await Promise.all([
    getStatisticsOverview(),
    getPlayers({ status: "active", page: 1, limit: 1 }),
    getPlayers({ status: "inactive", page: 1, limit: 1 }),
    getMatches({ status: "needs_review", page: 1, limit: 1 }),
    getMatches({ status: "processing_failed", page: 1, limit: 1 }),
    getMatches({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    getPeriodAnalytics("weekly"),
    getPeriodAnalytics("monthly"),
    getCurrentMvp({ awardType: "weekly" }),
  ]);
  return {
    overview: overview.data,
    activePlayers: activePlayers.pagination.totalItems,
    inactivePlayers: inactivePlayers.pagination.totalItems,
    pending: pending.pagination.totalItems,
    failed: failed.pagination.totalItems,
    recent: recent.data,
    weekly: weekly.data,
    monthly: monthly.data,
    mvp: mvp.data.award,
  };
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: getDashboardData });
  const recalculateMutation = useMutation({
    mutationFn: () =>
      recalculateStatistics({
        scope: "all",
        reason: "Administrator requested a complete verified statistics rebuild",
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isPending) return <LoadingState title="Loading admin dashboard" />;
  if (query.isError) {
    return (
      <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
    );
  }

  const data = query.data;
  const metrics = [
    {
      label: "Total players",
      value: data.activePlayers + data.inactivePlayers,
      helper: "All registered profiles",
      icon: Users,
    },
    {
      label: "Active players",
      value: data.activePlayers,
      helper: "Eligible league players",
      icon: UserCheck,
    },
    {
      label: "Verified matches",
      value: data.overview.totalVerifiedMatches,
      helper: "Official source records",
      icon: ShieldCheck,
    },
    {
      label: "Pending verification",
      value: data.pending,
      helper: "Awaiting moderator action",
      icon: Clock3,
    },
    {
      label: "Failed OCR",
      value: data.failed,
      helper: "Processing requires attention",
      icon: CircleAlert,
    },
    {
      label: "Official kills",
      value: data.overview.totalKills,
      helper: "Across verified results",
      icon: Activity,
    },
    {
      label: "League KDR",
      value: Number(data.overview.leagueKdr).toFixed(2),
      helper: data.overview.calculationVersion,
      icon: Crown,
    },
    {
      label: "Stale matches",
      value: data.overview.staleVerifiedMatches,
      helper: "Need statistics rebuild",
      icon: Trophy,
    },
    {
      label: "Matches this week",
      value: data.weekly.totals.verifiedMatches,
      helper: data.weekly.period.label,
      icon: Activity,
    },
    {
      label: "Matches this month",
      value: data.monthly.totals.verifiedMatches,
      helper: data.monthly.period.label,
      icon: Trophy,
    },
    {
      label: "Current weekly MVP",
      value: data.mvp?.player?.name ?? "Pending",
      helper: data.mvp
        ? `${data.mvp.score.toFixed(2)} points`
        : "Minimum matches not met",
      icon: Crown,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="League administration"
        title="Dashboard overview"
        description="Monitor verification operations and the consistency of official league data."
        icon={Crown}
        action={
          <button
            type="button"
            disabled={recalculateMutation.isPending}
            onClick={() => recalculateMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-50"
          >
            <RefreshCcw size={18} />
            {recalculateMutation.isPending ? "Recalculating…" : "Rebuild statistics"}
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Recent uploads" description="Latest screenshot activity">
          {data.recent.length ? (
            <div className="grid gap-3">
              {data.recent.map((match) => (
                <Link
                  key={match.id}
                  to={`/admin/matches/${match.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-amber-400 dark:border-slate-800"
                >
                  <div>
                    <p className="font-black">{match.matchCode}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase dark:bg-slate-800">
                    {match.status.replaceAll("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No match uploads"
              description="Uploaded screenshots will appear here."
            />
          )}
        </SectionCard>
        <SectionCard title="Data integrity" description="Official cache status">
          {data.overview.staleVerifiedMatches ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="font-black">
                {data.overview.staleVerifiedMatches} verified match(es) need
                recalculation
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Official match rows remain the source of truth. Use the rebuild action
                to refresh cached player statistics.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Official caches are consistent"
              description={`Latest calculation uses ${data.overview.calculationVersion}.`}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
