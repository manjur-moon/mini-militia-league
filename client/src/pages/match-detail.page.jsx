import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { MatchAIInsightPanel } from "@/features/ai/components/match-ai-insight-panel.jsx";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";
import { getMatch } from "@/services/match.service.js";

function getNumericValue(value, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeMatchResult(result) {
  const corrected =
    result?.corrected && typeof result.corrected === "object" ? result.corrected : null;

  const extracted =
    result?.extracted && typeof result.extracted === "object" ? result.extracted : null;

  /*
   * Verified results should use corrected values first.
   * Extracted and top-level values are retained as fallbacks.
   */
  const resultData = corrected ?? extracted ?? result ?? {};

  const populatedPlayer =
    result?.player && typeof result.player === "object" ? result.player : null;

  const kills = getNumericValue(resultData.kills ?? result?.kills);

  const deaths = getNumericValue(resultData.deaths ?? result?.deaths);

  const providedKdr = Number(resultData.kdr ?? result?.kdr);

  const kdr = Number.isFinite(providedKdr)
    ? providedKdr
    : deaths > 0
      ? kills / deaths
      : kills;

  const databasePlayerId =
    populatedPlayer?.id ??
    populatedPlayer?._id ??
    resultData.playerId ??
    result?.playerId ??
    null;

  /*
   * Prefer the public ID such as MM001 for the profile URL.
   * The database ObjectId is kept separately.
   */
  const publicPlayerId =
    populatedPlayer?.playerId ??
    resultData.publicPlayerId ??
    resultData.playerCode ??
    result?.publicPlayerId ??
    result?.playerCode ??
    "";

  const player = {
    ...(populatedPlayer ?? {}),

    id: databasePlayerId,

    playerId: publicPlayerId,

    name:
      populatedPlayer?.name ??
      resultData.playerName ??
      resultData.normalizedPlayerName ??
      result?.playerName ??
      result?.name ??
      "Unknown player",

    photoUrl:
      populatedPlayer?.photoUrl ??
      resultData.playerPhotoUrl ??
      resultData.photoUrl ??
      result?.playerPhotoUrl ??
      result?.photoUrl ??
      null,
  };

  return {
    player,
    databasePlayerId,
    placement: resultData.placement ?? result?.placement ?? "-",
    kills,
    deaths,
    kdr,
  };
}

function MatchResultRow({ result }) {
  const { player, placement, kills, deaths, kdr } = normalizeMatchResult(result);

  const playerContent = (
    <>
      <PlayerAvatar player={player} size="sm" />

      <span className="truncate">{player.name}</span>
    </>
  );

  return (
    <div className="grid grid-cols-[62px_1fr_64px_64px_64px] items-center gap-2 px-4 py-3 text-sm">
      <span className="text-lg font-black">#{placement}</span>

      {player.playerId ? (
        <Link
          to={`/players/${player.playerId}`}
          className="flex min-w-0 items-center gap-2 font-black transition hover:text-amber-600"
        >
          {playerContent}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-2 font-black">
          {playerContent}
        </div>
      )}

      <span className="font-black text-emerald-600 dark:text-emerald-400">{kills}</span>

      <span className="font-black text-red-600 dark:text-red-400">{deaths}</span>

      <span className="font-black">{kdr.toFixed(2)}</span>
    </div>
  );
}

export function MatchDetailPage() {
  const { matchId } = useParams();

  const query = useQuery({
    queryKey: ["public-match", matchId],

    queryFn: () => getMatch(matchId),

    enabled: Boolean(matchId),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <LoadingState title="Loading verified match" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const match = query.data?.data?.match;

  const results = Array.isArray(query.data?.data?.results)
    ? query.data.data.results
    : [];

  if (!match) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ErrorState
          description="The match details could not be found."
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const screenshotUrl = match.screenshot?.secureUrl;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to="/matches"
        className="font-bold text-amber-700 transition hover:text-amber-600 dark:text-amber-300"
      >
        ← Back to verified matches
      </Link>

      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="mr-1 inline" size={14} aria-hidden="true" />
              Verified
            </span>

            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black dark:bg-slate-800">
              Revision {match.currentRevision ?? 1}
            </span>
          </div>

          <h1 className="mt-3 text-4xl font-black">
            {match.matchCode ?? "Verified match"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <CalendarDays size={17} aria-hidden="true" />

              {match.matchDate
                ? new Date(match.matchDate).toLocaleString()
                : "Date unavailable"}
            </span>

            <span className="flex items-center gap-2">
              <Users size={17} aria-hidden="true" />
              {match.participantCount ?? results.length} players
            </span>
          </div>
        </div>
      </header>

      <MatchAIInsightPanel matchId={matchId} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        {screenshotUrl ? (
          <a href={screenshotUrl} target="_blank" rel="noreferrer">
            <img
              src={screenshotUrl}
              alt={`${match.matchCode ?? "Match"} original result screenshot`}
              className="w-full rounded-3xl border border-slate-200 bg-slate-950 object-contain shadow-xl dark:border-slate-800"
            />
          </a>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-slate-100 p-6 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Match screenshot is unavailable.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-[62px_1fr_64px_64px_64px] gap-2 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
            <span>Rank</span>
            <span>Player</span>
            <span>Kills</span>
            <span>Deaths</span>
            <span>KDR</span>
          </div>

          {results.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {results.map((result, index) => {
                const normalizedResult = normalizeMatchResult(result);

                return (
                  <MatchResultRow
                    key={
                      result?.id ??
                      result?._id ??
                      normalizedResult.databasePlayerId ??
                      `${matchId}-${result?.rowIndex ?? index}`
                    }
                    result={result}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-bold text-slate-500">
              No match results are available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
