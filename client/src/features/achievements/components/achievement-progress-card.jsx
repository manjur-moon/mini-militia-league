import { AchievementShareButton } from "@/features/sharing/components/achievement-share-button.jsx";
import { AchievementBadge } from "./achievement-badge.jsx";

export function AchievementProgressCard({ item }) {
  const percentage = Math.max(0, Math.min(100, Number(item.progress?.percentage ?? 0)));
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <AchievementBadge achievement={item.achievement} unlocked={item.isUnlocked} />
      <p className="mt-4 text-sm leading-6 text-slate-500">
        {item.achievement.description}
      </p>
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <span>
            {Number(item.progress?.current ?? 0).toLocaleString()} /{" "}
            {Number(
              item.progress?.target ?? item.achievement.targetValue ?? 0,
            ).toLocaleString()}
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
      {item.unlockedAt ? (
        <>
          <p className="mt-4 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            Unlocked {new Date(item.unlockedAt).toLocaleString()}
          </p>
          {item.player?.playerId ? (
            <AchievementShareButton
              playerId={item.player.playerId}
              achievementCode={item.achievement.code}
            />
          ) : null}
        </>
      ) : null}
    </article>
  );
}
