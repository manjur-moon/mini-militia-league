import { CalendarDays, Crown, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { SeasonStatusBadge } from "./season-status-badge.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function SeasonCard({ season }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
            League season
          </p>
          <h2 className="mt-2 text-2xl font-black">{season.name}</h2>
        </div>
        <SeasonStatusBadge status={season.status} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {season.description || "Competitive Mini Militia league season."}
      </p>
      <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
        <p className="flex items-center gap-2">
          <CalendarDays size={17} aria-hidden="true" />
          {formatDate(season.startAt)} – {formatDate(season.endAt)}
        </p>
        {season.champion ? (
          <p className="flex items-center gap-2 font-bold">
            <Crown size={17} aria-hidden="true" /> Champion: {season.champion.name}
          </p>
        ) : null}
        {season.mvpAward ? (
          <p className="flex items-center gap-2 font-bold">
            <Trophy size={17} aria-hidden="true" /> Season MVP score:{" "}
            {season.mvpAward.score}
          </p>
        ) : null}
      </div>
      <Link
        to={`/seasons/${season.slug}`}
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950"
      >
        View season
      </Link>
    </article>
  );
}
