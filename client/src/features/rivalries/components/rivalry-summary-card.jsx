import { Swords } from "lucide-react";
import { Link } from "react-router-dom";
import { PlayerAvatar } from "@/features/players/components/player-avatar.jsx";

function number(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

export function RivalrySummaryCard({ rivalry, playerId }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar
            player={{
              ...rivalry.opponent,
              profileImage: rivalry.opponent.photoUrl
                ? { secureUrl: rivalry.opponent.photoUrl }
                : null,
            }}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{rivalry.opponent.name}</p>
            <p className="text-sm font-bold text-slate-500">
              {rivalry.opponent.playerId}
            </p>
          </div>
        </div>
        <Swords className="text-amber-600" size={24} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
            Wins
          </p>
          <p className="mt-1 text-2xl font-black">{rivalry.wins}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs font-black uppercase text-slate-500">Draws</p>
          <p className="mt-1 text-2xl font-black">{rivalry.draws}</p>
        </div>
        <div className="rounded-xl bg-rose-500/10 p-3">
          <p className="text-xs font-black uppercase text-rose-700 dark:text-rose-300">
            Losses
          </p>
          <p className="mt-1 text-2xl font-black">{rivalry.losses}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <p className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="block text-xs font-bold text-slate-500">Shared matches</span>
          <strong>{rivalry.sharedMatches}</strong>
        </p>
        <p className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="block text-xs font-bold text-slate-500">Win rate</span>
          <strong>{number(rivalry.winRate)}%</strong>
        </p>
        <p className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="block text-xs font-bold text-slate-500">Your kills</span>
          <strong>{rivalry.player.totalKills}</strong>
        </p>
        <p className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="block text-xs font-bold text-slate-500">
            Comparative KDR
          </span>
          <strong>
            {number(rivalry.player.kdr)} vs {number(rivalry.opponent.kdr)}
          </strong>
        </p>
      </div>

      <Link
        to={`/players/${playerId}/rivalries/${rivalry.opponent.playerId}`}
        className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950"
      >
        View head-to-head
      </Link>
    </article>
  );
}
