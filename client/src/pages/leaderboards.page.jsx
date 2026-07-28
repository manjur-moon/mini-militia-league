import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Crown, Medal, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getLeaderboard } from "@/services/analytics.service.js";

const periodOptions = [
  {
    value: "daily",
    label: "Daily",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "season",
    label: "Active season",
  },
  {
    value: "all_time",
    label: "All time",
  },
];

const metricOptions = [
  {
    value: "overall",
    label: "Overall",
  },
  {
    value: "kills",
    label: "Kills",
  },
  {
    value: "kdr",
    label: "KDR",
  },
  {
    value: "activity",
    label: "Activity",
  },
  {
    value: "first_places",
    label: "First places",
  },
  {
    value: "deaths",
    label: "Deaths",
  },
  {
    value: "last_places",
    label: "Last places",
  },
];

function formatValue(metric, value) {
  if (["kdr", "win_rate", "average_rank", "overall"].includes(metric)) {
    return Number(value ?? 0).toFixed(2);
  }

  return Number(value ?? 0).toLocaleString();
}

function formatStartHour(hour) {
  const normalizedHour = Number.isInteger(Number(hour)) ? Number(hour) : 7;

  const hourInTwelveHourFormat = normalizedHour % 12 || 12;

  const meridiem = normalizedHour < 12 ? "AM" : "PM";

  return `${hourInTwelveHourFormat}:00 ${meridiem}`;
}

function RankIcon({ rank }) {
  if (rank === 1) {
    return <Crown size={19} className="text-amber-500" aria-hidden="true" />;
  }

  if (rank <= 3) {
    return <Medal size={19} className="text-slate-400" aria-hidden="true" />;
  }

  return <Trophy size={17} className="text-slate-400" aria-hidden="true" />;
}

function PlayerAvatar({ player }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-200 font-black dark:bg-slate-800">
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt={`${player.name} profile`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        player.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function MobileLeaderboardCard({ entry, metric }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/players/${entry.player.playerId}`}
          className="flex min-w-0 items-center gap-3 rounded-xl outline-none transition hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <PlayerAvatar player={entry.player} />

          <span className="min-w-0">
            <span className="block truncate font-black">{entry.player.name}</span>

            <span className="mt-0.5 block text-xs font-bold text-slate-500">
              {entry.player.playerId}
            </span>
          </span>
        </Link>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black dark:bg-slate-800">
          <RankIcon rank={entry.rank} />#{entry.rank}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
          Selected metric
        </p>

        <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
          {formatValue(metric, entry.value)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Matches
          </p>

          <p className="mt-1 font-black">{entry.metrics.matchesPlayed}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Kills
          </p>

          <p className="mt-1 font-black">{entry.metrics.totalKills}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            KDR
          </p>

          <p className="mt-1 font-black">{Number(entry.metrics.kdr).toFixed(2)}</p>
        </div>
      </div>
    </article>
  );
}

export function LeaderboardsPage() {
  const [periodType, setPeriodType] = useState("daily");

  const [metric, setMetric] = useState("overall");

  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      periodType,
      metric,
      page,
      limit: 20,

      ...(date && periodType !== "all_time"
        ? {
            date,
          }
        : {}),
    }),
    [date, metric, page, periodType],
  );

  const query = useQuery({
    queryKey: ["leaderboard", params],
    queryFn: () => getLeaderboard(params),

    placeholderData: (previousData) => previousData,
  });

  const periodMeta = query.data?.meta?.period;

  const leagueDayStartHour = periodMeta?.dayStartHour ?? 7;

  const leagueDayStartLabel = formatStartHour(leagueDayStartHour);

  const dateDisabled = periodType === "all_time";

  function handlePeriodChange(event) {
    const nextPeriodType = event.target.value;

    setPeriodType(nextPeriodType);
    setPage(1);

    if (nextPeriodType === "all_time") {
      setDate("");
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          Verified competition
        </p>

        <h1 className="mt-3 text-4xl font-black sm:text-5xl">League leaderboards</h1>

        <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
          Rankings are generated only from moderator-verified match results and use
          deterministic tie-breakers.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="grid gap-2 text-sm font-black">
          Period
          <select
            value={periodType}
            onChange={handlePeriodChange}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950"
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
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950"
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
            disabled={dateDisabled}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        {periodType === "daily" ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 md:col-span-3 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
            <div className="flex items-start gap-3">
              <CalendarDays size={20} className="mt-0.5 shrink-0" aria-hidden="true" />

              <div>
                <p className="font-black">
                  League day: {leagueDayStartLabel} to the next {leagueDayStartLabel}
                </p>

                <p className="mt-1 leading-6">
                  Matches before {leagueDayStartLabel} belong to the previous league
                  day. Daily rankings require at least one verified match.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {query.isFetching && !query.isPending ? (
        <p className="text-sm font-bold text-slate-500" role="status">
          Updating leaderboard...
        </p>
      ) : null}

      {query.isPending ? <LoadingState title="Loading leaderboard" /> : null}

      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}

      {query.data?.data?.length ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-slate-800">
              <div>
                <p className="font-black text-amber-700 dark:text-amber-300">
                  {periodMeta?.label ?? "Selected period"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Minimum {query.data.meta.minimumMatches} verified{" "}
                  {query.data.meta.minimumMatches === 1 ? "match" : "matches"}
                </p>

                {periodType === "daily" ? (
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Timezone: {periodMeta?.timezone ?? "Asia/Dhaka"}
                  </p>
                ) : null}
              </div>

              <span className="w-fit rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
                {query.data.meta.cacheHit ? "Cached" : "Recalculated"}
              </span>
            </div>

            {/* Desktop and tablet table */}
            <div className="hidden overflow-x-auto md:block">
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
                      className="border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-950/50"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 font-black">
                          <RankIcon rank={entry.rank} />#{entry.rank}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/players/${entry.player.playerId}`}
                          className="flex items-center gap-3 rounded-xl font-black outline-none transition hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <PlayerAvatar player={entry.player} />

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

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {query.data.data.map((entry) => (
              <MobileLeaderboardCard
                key={entry.player.id}
                entry={entry}
                metric={metric}
              />
            ))}
          </div>
        </div>
      ) : null}

      {query.data && !query.data.data.length ? (
        <EmptyState
          icon={Activity}
          title="No eligible players"
          description={
            periodType === "daily"
              ? "No verified matches were found for this 7:00 AM to 7:00 AM league day."
              : "No player currently satisfies the minimum verified-match requirement for this leaderboard."
          }
        />
      ) : null}

      {query.data?.pagination?.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:justify-center sm:gap-4 dark:border-slate-800 dark:bg-slate-900"
          aria-label="Leaderboard pagination"
        >
          <button
            type="button"
            disabled={!query.data.pagination.hasPreviousPage || query.isFetching}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-slate-700"
          >
            Previous
          </button>

          <span className="text-center text-sm font-black">
            Page {query.data.pagination.page} of {query.data.pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!query.data.pagination.hasNextPage || query.isFetching}
            onClick={() => setPage((value) => value + 1)}
            className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-slate-700"
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
