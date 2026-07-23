import { useQuery } from "@tanstack/react-query";
import { Swords } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getRivalryComparison, getRivalryMatches } from "@/services/rivalry.service.js";

function metric(label, value) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-950">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

export function RivalryDetailPage() {
  const { playerId, opponentId } = useParams();
  const comparisonQuery = useQuery({
    queryKey: ["rivalry-comparison", playerId, opponentId],
    queryFn: () => getRivalryComparison(playerId, opponentId),
  });
  const matchesQuery = useQuery({
    queryKey: ["rivalry-matches", playerId, opponentId],
    queryFn: () => getRivalryMatches(playerId, opponentId, { limit: 20 }),
  });

  if (comparisonQuery.isPending || matchesQuery.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <LoadingState title="Loading head-to-head comparison" />
      </div>
    );
  }
  if (comparisonQuery.isError || matchesQuery.isError) {
    const error = comparisonQuery.error ?? matchesQuery.error;
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <ErrorState title="Rivalry unavailable" description={error.message} />
      </div>
    );
  }

  const rivalry = comparisonQuery.data.data;
  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to={`/players/${playerId}/rivalries`}
        className="font-bold text-amber-700 dark:text-amber-300"
      >
        ← Back to rivalries
      </Link>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="text-center">
          <Swords className="mx-auto text-amber-500" size={38} />
          <h1 className="mt-3 text-3xl font-black">
            {rivalry.player.name} vs {rivalry.opponent.name}
          </h1>
          <p className="mt-2 text-slate-500">
            {rivalry.sharedMatches} shared verified matches
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metric("Wins", rivalry.wins)}
          {metric("Draws", rivalry.draws)}
          {metric("Losses", rivalry.losses)}
          {metric("Win rate", `${Number(rivalry.winRate).toFixed(1)}%`)}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[rivalry.player, rivalry.opponent].map((item) => (
            <article
              key={item.playerId}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <Link
                to={`/players/${item.playerId}`}
                className="text-xl font-black hover:text-amber-600"
              >
                {item.name}
              </Link>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <p>
                  <span className="block text-slate-500">Wins</span>
                  <strong>{item.headToHeadWins}</strong>
                </p>
                <p>
                  <span className="block text-slate-500">Kills</span>
                  <strong>{item.totalKills}</strong>
                </p>
                <p>
                  <span className="block text-slate-500">KDR</span>
                  <strong>{Number(item.kdr).toFixed(2)}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-black">Shared match evidence</h2>
        <div className="mt-4 grid gap-4">
          {matchesQuery.data.data.map((item) => (
            <Link
              key={item.matchId}
              to={`/matches/${item.matchId}`}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-400 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-black">{item.match.matchCode ?? item.matchId}</p>
                <p className="text-sm text-slate-500">
                  {new Date(item.matchDate).toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-bold">
                {item.playerResult.kills}/{item.playerResult.deaths} · #
                {item.playerResult.placement}
                {" vs "}
                {item.opponentResult.kills}/{item.opponentResult.deaths} · #
                {item.opponentResult.placement}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-center text-xs font-black uppercase ${item.outcome === "win" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : item.outcome === "loss" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                {item.outcome}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
