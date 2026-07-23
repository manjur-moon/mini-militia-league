import { CheckCircle2, LockKeyhole } from "lucide-react";

export function AchievementBadge({ achievement, unlocked = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${
          unlocked
            ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
        }`}
        aria-hidden="true"
      >
        {achievement.icon}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-black">{achievement.name}</p>
          {unlocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={12} /> Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-black text-slate-500">
              <LockKeyhole size={12} /> Locked
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-slate-500">
          {achievement.category} · {achievement.version}
        </p>
      </div>
    </div>
  );
}
