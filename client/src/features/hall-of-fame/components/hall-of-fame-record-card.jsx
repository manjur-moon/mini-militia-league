import { Crown, History, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

function formatRecordValue(value, unit) {
  if (unit === "KDR" || unit === "performance points") {
    return Number(value ?? 0).toFixed(2);
  }
  return Number(value ?? 0).toLocaleString();
}

export function HallOfFameRecordCard({ record, compact = false }) {
  const isCurrent = record.status === "current";
  const Icon = isCurrent ? Crown : History;
  return (
    <article className="relative overflow-hidden rounded-3xl border border-amber-300/60 bg-white p-5 shadow-sm dark:border-amber-500/20 dark:bg-slate-900">
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-400/15 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            {record.definition.icon} {record.definition.label}
          </p>
          <Link
            to={`/players/${record.player.playerId}`}
            className="mt-2 block text-xl font-black hover:text-amber-700 dark:hover:text-amber-300"
          >
            {record.player.name}
          </Link>
          <p className="mt-1 text-sm text-slate-500">{record.player.playerId}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-black">
            {formatRecordValue(record.recordValue, record.unit)}
          </p>
          <p className="text-sm font-bold text-slate-500">{record.unit}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
            isCurrent
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
          }`}
        >
          {record.status}
        </span>
      </div>

      {record.season ? (
        <p className="relative mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold dark:bg-slate-800">
          <Trophy size={16} /> {record.season.name}
        </p>
      ) : null}

      {!compact ? (
        <div className="relative mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800">
          <p>{record.criteria.definition}</p>
          <p>
            Awarded {new Date(record.awardDate).toLocaleDateString()} · Source{" "}
            {record.sourceVersion}
          </p>
        </div>
      ) : null}
    </article>
  );
}
