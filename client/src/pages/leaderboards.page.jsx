import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Eye, EyeOff } from "lucide-react";
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
  const emoji = rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏆";

  if (rank === 1) {
    return (
      <span
        className="text-lg leading-none drop-shadow-[0_1px_3px_rgba(180,131,0,0.6)]"
        aria-hidden="true"
      >
        {emoji}
      </span>
    );
  }

  return (
    <span className="text-base leading-none" aria-hidden="true">
      {emoji}
    </span>
  );
}

function PlayerAvatar({ player }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 font-semibold dark:border-gray-700 dark:bg-[#292929]">
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
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 outline-none transition hover:border-amber-400 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-amber-500 dark:hover:text-amber-300"
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
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-gray-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <CalendarDays size={20} className="mt-0.5 shrink-0" aria-hidden="true" />

            <div className="min-w-0">
              <p className="font-semibold">
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
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-500/40 dark:bg-gray-950/70 dark:text-gray-200 dark:hover:bg-gray-900"
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
  const isFirst = entry.rank === 1;

  return (
    <article
      className={
        isFirst
          ? "relative overflow-hidden rounded-lg border border-[#d4af37]/60 bg-gradient-to-br from-[#fff6dd] via-[#ffe8a8] to-[#fdd85d] p-4 shadow-[0_4px_18px_-6px_rgba(212,175,55,0.6)] transition-colors dark:border-amber-500/40 dark:from-[#3a2f0f] dark:via-[#5c4a15] dark:to-[#4a3a10]"
          : "rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-gray-800 dark:bg-[#252423] dark:hover:border-blue-500/50"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/players/${entry.player.playerId}`}
          className={`flex min-w-0 items-center gap-3 rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isFirst ? "hover:text-[#8a6a00]" : "hover:text-amber-600"
          }`}
        >
          {isFirst ? (
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border-2 border-[#d4af37] bg-gray-100 font-semibold shadow-[0_0_10px_-2px_rgba(212,175,55,0.8)] dark:bg-[#292929]">
              {entry.player.photoUrl ? (
                <img
                  src={entry.player.photoUrl}
                  alt={`${entry.player.name} profile`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                entry.player.name.slice(0, 1).toUpperCase()
              )}
            </span>
          ) : (
            <PlayerAvatar player={entry.player} />
          )}

          <span className="min-w-0">
            <span
              className={`block truncate font-semibold ${isFirst ? "text-[#5c4600] dark:text-amber-100" : ""}`}
            >
              {entry.player.name}
            </span>

            <span
              className={`mt-0.5 block text-xs font-bold ${
                isFirst ? "text-[#8a6a00]/80 dark:text-amber-300/70" : "text-gray-500"
              }`}
            >
              {entry.player.playerId}
            </span>
          </span>
        </Link>

        <span
          className={
            isFirst
              ? "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d4af37] bg-white/60 px-3 py-1.5 text-sm font-extrabold text-[#8a6a00] shadow-[0_0_8px_-2px_rgba(212,175,55,0.7)] dark:bg-black/20 dark:text-amber-200"
              : "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold dark:bg-gray-800"
          }
        >
          <RankIcon rank={entry.rank} />#{entry.rank}
        </span>
      </div>

      <div
        className={
          isFirst
            ? "mt-4 rounded-md border border-[#d4af37]/60 bg-white/50 p-4 dark:border-amber-400/30 dark:bg-black/20"
            : "mt-4 rounded-md border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/[0.06]"
        }
      >
        <p
          className={
            isFirst
              ? "text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a00] dark:text-amber-300"
              : "text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"
          }
        >
          Selected metric
        </p>

        <p
          className={`mt-1 text-3xl font-semibold ${
            Number(entry.value) < 0
              ? "text-red-600 dark:text-red-400"
              : isFirst
                ? "text-[#5c4600] dark:text-amber-100"
                : "text-gray-950 dark:text-white"
          }`}
        >
          {formatValue(metric, entry.value)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            Matches
          </p>

          <p
            className={`mt-1 font-semibold ${isFirst ? "text-[#5c4600] dark:text-amber-100" : ""}`}
          >
            {entry.metrics.matchesPlayed}
          </p>
        </div>

        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            Kills
          </p>

          <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
            {entry.metrics.totalKills}
          </p>
        </div>

        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            Deaths
          </p>

          <p className="mt-1 font-semibold text-red-700 dark:text-red-400">
            {entry.metrics.totalDeaths}
          </p>
        </div>

        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            First Place
          </p>

          <p
            className={`mt-1 font-semibold ${isFirst ? "text-[#5c4600] dark:text-amber-100" : ""}`}
          >
            {entry.metrics.firstPlaceCount}
          </p>
        </div>

        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            Last Place
          </p>

          <p
            className={`mt-1 font-semibold ${isFirst ? "text-[#5c4600] dark:text-amber-100" : ""}`}
          >
            {entry.metrics.lastPlaceCount}
          </p>
        </div>

        <div
          className={
            isFirst
              ? "rounded-md border border-[#d4af37]/50 bg-white/50 p-3 dark:border-amber-400/20 dark:bg-black/20"
              : "rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1F1F1F]"
          }
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${isFirst ? "text-[#8a6a00] dark:text-amber-300/80" : "text-gray-500"}`}
          >
            KDR
          </p>

          <p
            className={`mt-1 font-semibold ${isFirst ? "text-[#5c4600] dark:text-amber-100" : "text-gray-900 dark:text-white"}`}
          >
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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
          Verified competition
        </p>

        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">League leaderboards</h1>

        <p className="mt-4 text-base leading-7 text-gray-500 sm:text-lg">
          Rankings are generated only from moderator-verified match results and use
          deterministic tie-breakers.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-3 dark:border-gray-800 dark:bg-[#252423] dark:shadow-none">
        <label className="grid gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Period
          <select
            value={periodType}
            onChange={handlePeriodChange}
            className="min-h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-white dark:hover:border-blue-500/50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Metric
          <select
            value={metric}
            onChange={(event) => {
              setMetric(event.target.value);

              setPage(1);
            }}
            className="min-h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-white dark:hover:border-blue-500/50"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Reference date
          <input
            type="date"
            value={date}
            disabled={dateDisabled}
            onChange={(event) => {
              setDate(event.target.value);

              setPage(1);
            }}
            className="min-h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-white dark:hover:border-blue-500/50"
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
        <p className="text-sm font-bold text-gray-500" role="status">
          Updating leaderboard...
        </p>
      ) : null}

      {query.isPending ? <LoadingState title="Loading leaderboard" /> : null}

      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}

      {query.data?.data?.length ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#252423] dark:shadow-none">
            <div className="hidden" aria-hidden="true">
              <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    {periodMeta?.label ?? "Selected period"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Minimum {query.data.meta.minimumMatches} verified{" "}
                    {query.data.meta.minimumMatches === 1 ? "match" : "matches"}
                  </p>

                  {periodType === "daily" ? (
                    <p className="mt-1 text-xs font-bold text-gray-500">
                      Timezone: {periodMeta?.timezone ?? "Asia/Dhaka"}
                    </p>
                  ) : null}
                </div>

                <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {query.data.meta.cacheHit ? "Cached" : "Recalculated"}
                </span>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse text-left">
                <thead className="border-b border-gray-200 bg-gray-100/80 text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Player</th>
                    <th className="px-5 py-3">Points</th>
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
                      className={`relative border-b transition-colors last:border-b-0 ${
                        entry.rank === 1
                          ? "border-amber-300/60 bg-gradient-to-r from-[#fff6dd] via-[#ffe8a8] to-[#fff6dd] bg-[length:200%_100%] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_4px_0_0_0_#d4af37,0_4px_16px_-6px_rgba(212,175,55,0.55)] hover:bg-[right_center] dark:border-amber-500/30 dark:bg-gradient-to-r dark:from-[#3a2f0f] dark:via-[#5c4a15] dark:to-[#3a2f0f] dark:shadow-[inset_4px_0_0_0_#e6c866,0_4px_16px_-6px_rgba(212,175,55,0.35)]"
                          : `border-gray-200 dark:border-gray-800 ${
                              index % 2 === 0
                                ? "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/80"
                                : "bg-gray-50/70 hover:bg-gray-100/80 dark:bg-gray-950/45 dark:hover:bg-gray-800/80"
                            }`
                      }`}
                      style={
                        entry.rank === 1
                          ? {
                              transition:
                                "background-position 0.6s ease, background-color 0.2s ease",
                            }
                          : undefined
                      }
                    >
                      <td className="px-5 py-5 text-gray-700 dark:text-gray-200">
                        <span
                          className={
                            entry.rank === 1
                              ? "inline-flex items-center gap-2 text-base font-extrabold text-[#8a6a00] [text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:text-amber-300"
                              : "inline-flex items-center gap-2 font-semibold"
                          }
                        >
                          <RankIcon rank={entry.rank} />#{entry.rank}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-gray-700 dark:text-gray-200">
                        <Link
                          to={`/players/${entry.player.playerId}`}
                          className={`flex items-center gap-3 rounded-md font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            entry.rank === 1
                              ? "text-[#5c4600] hover:text-[#8a6a00] dark:text-amber-100 dark:hover:text-amber-200"
                              : "text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                          }`}
                        >
                          {entry.rank === 1 ? (
                            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border-2 border-[#d4af37] bg-gray-100 font-semibold shadow-[0_0_10px_-2px_rgba(212,175,55,0.8)] dark:bg-[#292929]">
                              {entry.player.photoUrl ? (
                                <img
                                  src={entry.player.photoUrl}
                                  alt={`${entry.player.name} profile`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                entry.player.name.slice(0, 1).toUpperCase()
                              )}
                            </span>
                          ) : (
                            <PlayerAvatar player={entry.player} />
                          )}

                          <span>
                            {entry.player.name}

                            <small
                              className={`mt-0.5 block font-bold ${
                                entry.rank === 1
                                  ? "text-[#8a6a00]/80 dark:text-amber-300/70"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {entry.player.playerId}
                            </small>
                          </span>
                        </Link>
                      </td>

                      <td
                        className={`px-5 py-5 text-lg font-semibold ${
                          Number(entry.value) < 0
                            ? "text-red-600 dark:text-red-400"
                            : entry.rank === 1
                              ? "text-[#7a5d00] dark:text-amber-200"
                              : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {formatValue(metric, entry.value)}
                      </td>

                      <td className="px-5 py-5 text-gray-700 dark:text-gray-200">
                        <span
                          className={
                            entry.rank === 1
                              ? "inline-flex min-w-9 justify-center rounded-md border border-[#d4af37]/50 bg-white/50 px-2.5 py-1 font-bold text-[#7a5d00] dark:bg-black/20 dark:text-amber-200"
                              : "inline-flex min-w-9 justify-center rounded-md bg-gray-100 px-2.5 py-1 font-bold dark:bg-[#292929] dark:text-gray-200"
                          }
                        >
                          {entry.metrics.matchesPlayed}
                        </span>
                      </td>
                      <td className="px-5 py-5 font-bold text-emerald-700 dark:text-emerald-400">
                        {entry.metrics.totalKills}
                      </td>
                      <td className="px-5 py-5 font-bold text-red-700 dark:text-red-400">
                        {entry.metrics.totalDeaths}
                      </td>

                      <td
                        className={`px-5 py-5 font-bold ${
                          entry.rank === 1
                            ? "text-[#7a5d00] dark:text-amber-200"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        <span
                          className={
                            entry.rank === 1
                              ? "inline-flex min-w-9 justify-center rounded-md border border-[#d4af37]/50 bg-white/50 px-2.5 py-1 text-[#7a5d00] dark:bg-black/20 dark:text-amber-200"
                              : "inline-flex min-w-9 justify-center rounded-md border border-gray-200 bg-gray-100/80 px-2.5 py-1 text-gray-800 dark:border-gray-800 dark:bg-[#292929] dark:text-gray-200"
                          }
                        >
                          {entry.metrics.firstPlaceCount}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-5 font-bold ${
                          entry.rank === 1
                            ? "text-[#7a5d00] dark:text-amber-200"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        <span
                          className={
                            entry.rank === 1
                              ? "inline-flex min-w-9 justify-center rounded-md border border-[#d4af37]/50 bg-white/50 px-2.5 py-1 text-[#7a5d00] dark:bg-black/20 dark:text-amber-200"
                              : "inline-flex min-w-9 justify-center rounded-md border border-gray-200 bg-gray-100/80 px-2.5 py-1 text-gray-800 dark:border-gray-800 dark:bg-[#292929] dark:text-gray-200"
                          }
                        >
                          {entry.metrics.lastPlaceCount}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-5 font-bold ${
                          entry.rank === 1
                            ? "text-[#7a5d00] dark:text-amber-200"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
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
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:justify-center sm:gap-4 dark:border-gray-700 dark:bg-gray-900"
          aria-label="Leaderboard pagination"
        >
          <button
            type="button"
            disabled={!query.data.pagination.hasPreviousPage || query.isFetching}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            Previous
          </button>

          <span className="text-center text-sm font-semibold">
            Page {query.data.pagination.page} of {query.data.pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!query.data.pagination.hasNextPage || query.isFetching}
            onClick={() => setPage((value) => value + 1)}
            className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 dark:border-gray-800 dark:bg-[#1F1F1F] dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
