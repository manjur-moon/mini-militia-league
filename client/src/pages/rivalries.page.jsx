import { useQuery } from "@tanstack/react-query";
import { Swords, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getRivalOfWeek } from "@/services/rivalry.service.js";

function Fighter({ player, label }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-950">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mx-auto mt-3 grid size-20 place-items-center overflow-hidden rounded-2xl bg-amber-500 text-2xl font-black text-slate-950">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="size-full object-cover"
          />
        ) : (
          player.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
        )}
      </div>
      <Link
        to={`/players/${player.playerId}`}
        className="mt-3 block text-xl font-black hover:text-amber-600"
      >
        {player.name}
      </Link>
      <p className="text-sm font-bold text-slate-500">{player.playerId}</p>
      <p className="mt-3 text-sm">
        <strong>{player.headToHeadWins}</strong> head-to-head wins ·{" "}
        <strong>{player.totalKills}</strong> kills
      </p>
    </div>
  );
}

export function RivalriesPage() {
  const query = useQuery({
    queryKey: ["rival-of-week"],
    queryFn: () => getRivalOfWeek(),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <LoadingState title="Loading rival of the week" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <ErrorState
          title="Rivalry analytics unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const result = query.data.data;
  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          <Swords size={18} /> Competitive matchups
        </p>
        <h1 className="mt-3 text-4xl font-black">League rivalries</h1>
        <p className="mt-4 text-slate-500">
          A shared verified match is decided by better placement. Equal placement uses
          kills as the tie-breaker; equal placement and kills produce a draw.
        </p>
      </div>

      {result.rivalry ? (
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-300">
                <Trophy size={18} /> Rival of the week
              </p>
              <h2 className="mt-2 text-2xl font-black">{result.period.label}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black dark:bg-slate-800">
              Competitiveness {Number(result.rivalry.competitivenessScore).toFixed(1)}
            </span>
          </div>
          <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <Fighter player={result.rivalry.playerA} label="Player A" />
            <div className="text-center">
              <Swords className="mx-auto text-amber-500" size={34} />
              <p className="mt-2 text-sm font-black">
                {result.rivalry.sharedMatches} shared matches
              </p>
              <p className="text-xs text-slate-500">{result.rivalry.draws} draws</p>
            </div>
            <Fighter player={result.rivalry.playerB} label="Player B" />
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            {result.selectionRule}
          </p>
        </article>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <h2 className="text-xl font-black">No weekly rivalry yet</h2>
          <p className="mt-2 text-slate-500">
            At least two shared verified matches are required for Rival of the Week.
          </p>
        </div>
      )}
    </section>
  );
}
