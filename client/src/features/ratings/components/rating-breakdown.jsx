import { Activity, Crosshair, Shield, Target, Trophy } from "lucide-react";

const ratingItems = [
  { key: "overall", label: "Overall", icon: Trophy },
  { key: "attack", label: "Attack", icon: Crosshair },
  { key: "survival", label: "Survival", icon: Shield },
  { key: "consistency", label: "Consistency", icon: Target },
  { key: "activity", label: "Activity", icon: Activity },
];

function tone(value) {
  if (value >= 85) return "text-emerald-600 dark:text-emerald-300";
  if (value >= 70) return "text-amber-600 dark:text-amber-300";
  if (value >= 50) return "text-indigo-600 dark:text-indigo-300";
  return "text-slate-500";
}

export function RatingBreakdown({ rating, compact = false }) {
  if (!rating) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
        <p className="font-black">No verified rating yet</p>
        <p className="mt-2 text-sm text-slate-500">
          A rating appears after the player has verified match data.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${compact ? "sm:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-5"}`}
    >
      {ratingItems.map((item) => {
        const Icon = item.icon;
        const value = rating.ratings[item.key] ?? 0;
        return (
          <article
            key={item.key}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-500">{item.label}</span>
              <Icon size={18} aria-hidden="true" />
            </div>
            <p className={`mt-3 text-3xl font-black ${tone(value)}`}>
              {Number(value).toFixed(1)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
