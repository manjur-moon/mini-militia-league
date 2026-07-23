import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck, Users } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { AchievementBadge } from "@/features/achievements/components/achievement-badge.jsx";
import { getAchievements } from "@/services/achievement.service.js";

function conditionText(condition) {
  const operators = { gte: "≥", lte: "≤", gt: ">", lt: "<", eq: "=" };
  return `${condition.metric} ${operators[condition.operator]} ${condition.value}`;
}

export function AchievementsPage() {
  const query = useQuery({
    queryKey: ["achievements"],
    queryFn: () => getAchievements(),
  });
  if (query.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <LoadingState title="Loading achievements" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          title="Achievements unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Career milestones
        </p>
        <h1 className="mt-3 text-4xl font-black">League achievements</h1>
        <p className="mt-4 text-slate-500">
          Progress is calculated from verified statistics. Once unlocked, an achievement
          keeps its historical rule snapshot even when a new rule version is activated.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {query.data.data.map((achievement) => (
          <article
            key={achievement.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <AchievementBadge achievement={achievement} />
            <p className="mt-4 text-sm leading-6 text-slate-500">
              {achievement.description}
            </p>
            <div className="mt-5 grid gap-2 text-sm">
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} /> Minimum {achievement.minimumMatches} verified
                matches
              </p>
              <p className="flex items-center gap-2">
                <Award size={16} /> Target {achievement.targetValue.toLocaleString()}{" "}
                {achievement.progressMetric}
              </p>
              <p className="flex items-center gap-2">
                <Users size={16} /> {achievement.unlockedPlayerCount} player
                {achievement.unlockedPlayerCount === 1 ? "" : "s"} unlocked
              </p>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Criteria ({achievement.criteria.combinator})
              </p>
              <ul className="mt-2 space-y-1 text-sm font-bold">
                {achievement.criteria.conditions.map((condition) => (
                  <li key={`${condition.metric}-${condition.operator}`}>
                    {conditionText(condition)}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
