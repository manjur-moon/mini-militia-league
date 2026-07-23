import { useQuery } from "@tanstack/react-query";
import { Activity, Crown, Medal, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getLeaderboard } from "@/services/analytics.service.js";

const periodOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "season", label: "Active season" },
  { value: "all_time", label: "All time" },
];
const metricOptions = [
  { value: "overall", label: "Overall" },
  { value: "kills", label: "Kills" },
  { value: "kdr", label: "KDR" },
  { value: "activity", label: "Activity" },
  { value: "first_places", label: "First places" },
  { value: "deaths", label: "Deaths" },
  { value: "last_places", label: "Last places" },
];

function formatValue(metric, value) {
  if (["kdr", "win_rate", "average_rank", "overall"].includes(metric)) {
    return Number(value ?? 0).toFixed(2);
  }
  return Number(value ?? 0).toLocaleString();
}

export function LeaderboardsPage() {
  const [periodType, setPeriodType] = useState("weekly");
  const [metric, setMetric] = useState("overall");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({
      periodType,
      metric,
      page,
      limit: 20,
      ...(date && periodType !== "all_time" ? { date } : {}),
    }),
    [date, metric, page, periodType],
  );
  const query = useQuery({
    queryKey: ["leaderboard", params],
    queryFn: () => getLeaderboard(params),
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          Verified competition
        </p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">League leaderboards</h1>
        <p className="mt-4 text-lg text-slate-500">
          Rankings are generated only from moderator-verified match results and use
          deterministic tie-breakers.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="grid gap-2 text-sm font-black">
          Period
          <select
            value={periodType}
            onChange={(event) => {
              setPeriodType(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black">
          Metric
          <select
            value={metric}
            onChange={(event) => {
              setMetric(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black">
          Reference date
          <input
            type="date"
            value={date}
            disabled={periodType === "all_time"}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      </div>

      {query.isPending ? <LoadingState title="Loading leaderboard" /> : null}
      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}
      {query.data?.data?.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <p className="text-sm font-black text-amber-700 dark:text-amber-300">
                {query.data.meta.period.label}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Minimum {query.data.meta.minimumMatches} verified match(es)
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
              {query.data.meta.cacheHit ? "Cached" : "Recalculated"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Player</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Matches</th>
                  <th className="px-5 py-3">Kills</th>
                  <th className="px-5 py-3">KDR</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((entry) => (
                  <tr
                    key={entry.player.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 font-black">
                        {entry.rank === 1 ? (
                          <Crown size={18} className="text-amber-500" />
                        ) : entry.rank <= 3 ? (
                          <Medal size={18} className="text-slate-400" />
                        ) : (
                          <Trophy size={16} className="text-slate-400" />
                        )}
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/players/${entry.player.playerId}`}
                        className="flex items-center gap-3 font-black hover:text-amber-600"
                      >
                        <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                          {entry.player.photoUrl ? (
                            <img
                              src={entry.player.photoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            entry.player.name.slice(0, 1)
                          )}
                        </span>
                        <span>
                          {entry.player.name}
                          <small className="block font-bold text-slate-500">
                            {entry.player.playerId}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-lg font-black">
                      {formatValue(metric, entry.value)}
                    </td>
                    <td className="px-5 py-4">{entry.metrics.matchesPlayed}</td>
                    <td className="px-5 py-4">{entry.metrics.totalKills}</td>
                    <td className="px-5 py-4">
                      {Number(entry.metrics.kdr).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {query.data && !query.data.data.length ? (
        <EmptyState
          icon={Activity}
          title="No eligible players"
          description="No player currently satisfies the minimum verified-match requirement for this leaderboard."
        />
      ) : null}
      {query.data?.pagination?.totalPages > 1 ? (
        <div className="flex justify-center gap-4">
          <button
            disabled={!query.data.pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-xl border px-4 py-2 font-black disabled:opacity-40"
          >
            Previous
          </button>
          <span className="py-2 font-black">
            Page {query.data.pagination.page} of {query.data.pagination.totalPages}
          </span>
          <button
            disabled={!query.data.pagination.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border px-4 py-2 font-black disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
