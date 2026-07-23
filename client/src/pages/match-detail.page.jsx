import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { MatchAIInsightPanel } from "@/features/ai/components/match-ai-insight-panel.jsx";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";
import { getMatch } from "@/services/match.service.js";

export function MatchDetailPage() {
  const { matchId } = useParams();
  const query = useQuery({
    queryKey: ["public-match", matchId],
    queryFn: () => getMatch(matchId),
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

  const { match, results } = query.data.data;
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <Link to="/matches" className="font-bold text-amber-700 dark:text-amber-300">
        ← Back to verified matches
      </Link>
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="mr-1 inline" size={14} /> Verified
            </span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black dark:bg-slate-800">
              Revision {match.currentRevision}
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-black">{match.matchCode}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <CalendarDays size={17} /> {new Date(match.matchDate).toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              <Users size={17} /> {match.participantCount} players
            </span>
          </div>
        </div>
      </header>

      <MatchAIInsightPanel matchId={matchId} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <a href={match.screenshot.secureUrl} target="_blank" rel="noreferrer">
          <img
            src={match.screenshot.secureUrl}
            alt={`${match.matchCode} original result screenshot`}
            className="w-full rounded-3xl border border-slate-200 bg-slate-950 object-contain shadow-xl dark:border-slate-800"
          />
        </a>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-[62px_1fr_64px_64px_64px] gap-2 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white">
            <span>Rank</span>
            <span>Player</span>
            <span>Kills</span>
            <span>Deaths</span>
            <span>KDR</span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {results.map((result) => (
              <div
                key={result.player.id}
                className="grid grid-cols-[62px_1fr_64px_64px_64px] items-center gap-2 px-4 py-3 text-sm"
              >
                <span className="text-lg font-black">#{result.placement}</span>
                <Link
                  to={
                    result.player.playerId ? `/players/${result.player.playerId}` : "#"
                  }
                  className="flex min-w-0 items-center gap-2 font-black hover:text-amber-600"
                >
                  <PlayerAvatar player={result.player} size="sm" />
                  <span className="truncate">{result.player.name}</span>
                </Link>
                <span className="font-black text-emerald-600">{result.kills}</span>
                <span className="font-black text-red-600">{result.deaths}</span>
                <span className="font-black">{result.kdr.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
