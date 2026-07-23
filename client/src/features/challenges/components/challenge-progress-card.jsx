import { CheckCircle2, Clock3, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const SYMBOLS = { gte: "≥", lte: "≤", gt: ">", lt: "<" };

function formatValue(value) {
  const number = Number(value ?? 0);
  return Number.isInteger(number)
    ? number.toLocaleString()
    : number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function ChallengeProgressCard({ item, showLink = true }) {
  const challenge = item.challenge ?? item;
  const percentage = Math.max(
    0,
    Math.min(
      100,
      Number(item.progressPercentage ?? (item.status === "completed" ? 100 : 0)),
    ),
  );
  const currentValue = item.currentValue ?? 0;
  const status = item.status ?? challenge.status;
  const completed = status === "completed";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-2xl">
            {challenge.icon ?? "🎯"}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              {challenge.type} challenge
            </p>
            <h3 className="mt-1 text-lg font-black">{challenge.name}</h3>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
            completed
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {completed ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
          {String(status).replace("_", " ")}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{challenge.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
        <p>
          <span className="block text-xs font-black uppercase text-slate-500">
            Target
          </span>
          <span className="mt-1 block font-black">
            {SYMBOLS[challenge.targetOperator] ?? "≥"}{" "}
            {formatValue(challenge.targetValue)} {challenge.metric}
          </span>
        </p>
        <p>
          <span className="block text-xs font-black uppercase text-slate-500">
            Minimum
          </span>
          <span className="mt-1 block font-black">
            {challenge.minimumMatches ?? 0} matches
          </span>
        </p>
      </div>

      {item.challenge ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm font-black">
            <span>
              {formatValue(currentValue)} /{" "}
              {formatValue(item.targetValue ?? challenge.targetValue)}
            </span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
          <Trophy size={15} /> {challenge.reward?.name ?? "League badge"}
        </span>
        {showLink ? (
          <Link
            to={`/challenges/${challenge.code}`}
            className="inline-flex items-center gap-1 text-sm font-black text-amber-700 dark:text-amber-300"
          >
            <Target size={15} /> Details
          </Link>
        ) : null}
      </div>
    </article>
  );
}
