import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  Crown,
  Eye,
  EyeOff,
  Medal,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getLeaderboard } from "@/services/analytics.service.js";

const DAILY_INFO_VISIBILITY_KEY = "leaderboard-daily-info-visible";

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

function readDailyInfoVisibility() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const savedValue = window.localStorage.getItem(DAILY_INFO_VISIBILITY_KEY);

    return savedValue !== "false";
  } catch {
    return true;
  }
}

function saveDailyInfoVisibility(value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DAILY_INFO_VISIBILITY_KEY, String(value));
  } catch {
    // Ignore storage errors.
  }
}

function formatValue(metric, value) {
  if (["kdr", "win_rate", "average_rank", "overall"].includes(metric)) {
    return Number(value ?? 0).toFixed(2);
  }

  return Number(value ?? 0).toLocaleString();
}

function formatStartHour(hour) {
  const parsedHour = Number(hour);

  const normalizedHour = Number.isInteger(parsedHour) ? parsedHour : 7;

  const hourInTwelveHourFormat = normalizedHour % 12 || 12;

  const meridiem = normalizedHour < 12 ? "AM" : "PM";

  return `${hourInTwelveHourFormat}:00 ${meridiem}`;
}

function RankIcon({ rank }) {
  if (rank === 1) {
    return <Crown size={19} className="text-cyan-400" aria-hidden="true" />;
  }

  if (rank <= 3) {
    return <Medal size={19} className="text-slate-400" aria-hidden="true" />;
  }

  return <Trophy size={17} className="text-slate-400" aria-hidden="true" />;
}

function PlayerAvatar({ player }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 font-black dark:border-slate-700 dark:bg-[#0b1d30]">
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

function DailyLeaderboardInfo({ startHourLabel, isVisible, onToggle }) {
  if (!isVisible) {
    return (
      <div className="flex justify-end md:col-span-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded="false"
          aria-controls="daily-league-info"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-600 outline-none transition hover:border-amber-400 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-500 dark:hover:text-amber-300"
        >
          <Eye size={16} aria-hidden="true" />
          Show daily info
        </button>
      </div>
    );
  }

  return (
    <div className="md:col-span-3">
      <div
        id="daily-league-info"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-slate-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <CalendarDays size={20} className="mt-0.5 shrink-0" aria-hidden="true" />

            <div className="min-w-0">
              <p className="font-black">
                League day: {startHourLabel} to the next {startHourLabel}
              </p>

              <p className="mt-1 leading-6">
                Matches before {startHourLabel} belong to the previous league day. Daily
                rankings require at least one verified match.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded="true"
            aria-controls="daily-league-info"
            aria-label="Hide daily leaderboard information"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white/70 px-3 py-2 text-xs font-black text-slate-800 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-500/40 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <EyeOff size={16} aria-hidden="true" />

            <span className="hidden sm:inline">Hide info</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileLeaderboardCard({ entry, metric }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-cyan-300 dark:border-slate-800 dark:bg-[#08111f] dark:hover:border-cyan-500/50">
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

      <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/[0.06]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
          Selected metric
        </p>

        <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
          {formatValue(metric, entry.value)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Matches
          </p>

          <p className="mt-1 font-black">{entry.metrics.matchesPlayed}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Kills
          </p>

          <p className="mt-1 font-black text-emerald-700 dark:text-emerald-400">
            {entry.metrics.totalKills}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Deaths
          </p>

          <p className="mt-1 font-black text-red-700 dark:text-red-400">
            {entry.metrics.totalDeaths}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            First Place
          </p>

          <p className="mt-1 font-black">{entry.metrics.firstPlaceCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Last Place
          </p>

          <p className="mt-1 font-black">{entry.metrics.lastPlaceCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#050b16]">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            KDR
          </p>

          <p className="mt-1 font-black text-slate-900 dark:text-white">
            {Number(entry.metrics.kdr).toFixed(2)}
          </p>
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

  const [isDailyInfoVisible, setIsDailyInfoVisible] = useState(readDailyInfoVisibility);

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

  function toggleDailyInfo() {
    setIsDailyInfoVisible((currentValue) => {
      const nextValue = !currentValue;

      saveDailyInfoVisibility(nextValue);

      return nextValue;
    });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
          Verified competition
        </p>

        <h1 className="mt-3 text-4xl font-black sm:text-5xl">League leaderboards</h1>

        <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
          Rankings are generated only from moderator-verified match results and use
          deterministic tie-breakers.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-3 dark:border-slate-800 dark:bg-[#08111f] dark:shadow-none">
        <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
          Period
          <select
            value={periodType}
            onChange={handlePeriodChange}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-800 dark:bg-[#050b16] dark:text-white dark:hover:border-cyan-500/50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
          Metric
          <select
            value={metric}
            onChange={(event) => {
              setMetric(event.target.value);

              setPage(1);
            }}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-800 dark:bg-[#050b16] dark:text-white dark:hover:border-cyan-500/50"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
          Reference date
          <input
            type="date"
            value={date}
            disabled={dateDisabled}
            onChange={(event) => {
              setDate(event.target.value);

              setPage(1);
            }}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#050b16] dark:text-white dark:hover:border-cyan-500/50"
          />
        </label>

        <div className="hidden" aria-hidden="true">
          {periodType === "daily" ? (
            <DailyLeaderboardInfo
              startHourLabel={leagueDayStartLabel}
              isVisible={isDailyInfoVisible}
              onToggle={toggleDailyInfo}
            />
          ) : null}
        </div>
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#08111f] dark:shadow-none">
            <div className="hidden" aria-hidden="true">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-slate-800">
                <div>
                  <p className="font-black text-cyan-700 dark:text-cyan-300">
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

                <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-black text-cyan-700 dark:text-cyan-300">
                  {query.data.meta.cacheHit ? "Cached" : "Recalculated"}
                </span>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse text-left">
                <thead className="border-b border-slate-200 bg-slate-100/80 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:bg-[#050b16] dark:text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Player</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">Matches</th>
                    <th className="px-5 py-3">Kills</th>
                    <th className="px-5 py-3">Deaths</th>
                    <th className="px-5 py-3">First Place</th>
                    <th className="px-5 py-3">Last Place</th>
                    <th className="px-5 py-3">KDR</th>
                  </tr>
                </thead>

                <tbody>
                  {query.data.data.map((entry, index) => (
                    <tr
                      key={entry.player.id}
                      className={`border-b border-slate-200 transition-colors last:border-b-0 dark:border-slate-800 ${
                        index % 2 === 0
                          ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                          : "bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-950/45 dark:hover:bg-slate-800/80"
                      } ${entry.rank === 1 ? "shadow-[inset_3px_0_0_0_rgb(245_158_11)]" : ""}`}
                    >
                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">
                        <span className="inline-flex items-center gap-2 font-black">
                          <RankIcon rank={entry.rank} />#{entry.rank}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">
                        <Link
                          to={`/players/${entry.player.playerId}`}
                          className="flex items-center gap-3 rounded-xl font-black text-slate-900 outline-none transition hover:text-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-white dark:hover:text-cyan-300"
                        >
                          <PlayerAvatar player={entry.player} />

                          <span>
                            {entry.player.name}

                            <small className="mt-0.5 block font-bold text-slate-500 dark:text-slate-400">
                              {entry.player.playerId}
                            </small>
                          </span>
                        </Link>
                      </td>

                      <td className="px-5 py-5 text-lg font-black text-slate-900 dark:text-white">
                        {formatValue(metric, entry.value)}
                      </td>

                      <td className="px-5 py-5 text-slate-700 dark:text-slate-200">
                        <span className="inline-flex min-w-9 justify-center rounded-md bg-slate-100 px-2.5 py-1 font-bold dark:bg-[#0b1d30] dark:text-slate-200">
                          {entry.metrics.matchesPlayed}
                        </span>
                      </td>
                      <td className="px-5 py-5 font-bold text-emerald-700 dark:text-emerald-400">
                        {entry.metrics.totalKills}
                      </td>
                      <td className="px-5 py-5 font-bold text-red-700 dark:text-red-400">
                        {entry.metrics.totalDeaths}
                      </td>

                      <td className="px-5 py-5 font-bold text-slate-800 dark:text-slate-100">
                        <span className="inline-flex min-w-9 justify-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-slate-800 dark:border-slate-800 dark:bg-[#0b1d30] dark:text-slate-200">
                          {entry.metrics.firstPlaceCount}
                        </span>
                      </td>

                      <td className="px-5 py-5 font-bold text-slate-800 dark:text-slate-100">
                        <span className="inline-flex min-w-9 justify-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-slate-800 dark:border-slate-800 dark:bg-[#0b1d30] dark:text-slate-200">
                          {entry.metrics.lastPlaceCount}
                        </span>
                      </td>

                      <td className="px-5 py-5 font-bold text-slate-900 dark:text-white">
                        {Number(entry.metrics.kdr).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:justify-center sm:gap-4 dark:border-slate-700 dark:bg-slate-900"
          aria-label="Leaderboard pagination"
        >
          <button
            type="button"
            disabled={!query.data.pagination.hasPreviousPage || query.isFetching}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition-colors hover:border-cyan-400 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-slate-800 dark:bg-[#050b16] dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
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
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition-colors hover:border-cyan-400 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-slate-800 dark:bg-[#050b16] dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
