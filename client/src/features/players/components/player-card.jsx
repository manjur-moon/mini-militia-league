import { CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PlayerAvatar } from "./player-avatar.jsx";

export function PlayerCard({ player }) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
              {player.playerId}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${player.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              {player.status}
            </span>
          </div>
          <h2 className="mt-3 truncate text-xl font-black">{player.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} aria-hidden="true" />
            Joined {new Date(player.joinDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      {player.aliases.length ? (
        <p className="mt-5 line-clamp-2 text-sm text-slate-500">
          Aliases: {player.aliases.join(", ")}
        </p>
      ) : null}
      <Link
        to={`/players/${player.playerId}`}
        className="mt-5 inline-flex items-center gap-2 font-black text-amber-700 hover:text-amber-600 dark:text-amber-300"
      >
        View profile <ChevronRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
