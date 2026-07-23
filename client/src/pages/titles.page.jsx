import { useQuery } from "@tanstack/react-query";
import { Award, CalendarRange, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { TitleBadge } from "@/features/titles/components/title-badge.jsx";
import { getTitles } from "@/services/title.service.js";

function conditionText(condition) {
  const operators = { gte: "≥", lte: "≤", gt: ">", lt: "<", eq: "=" };
  return `${condition.metric} ${operators[condition.operator]} ${condition.value}`;
}

export function TitlesPage() {
  const query = useQuery({ queryKey: ["dynamic-titles"], queryFn: getTitles });
  if (query.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <LoadingState title="Loading title rules" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          title="Titles unavailable"
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
          Dynamic recognition
        </p>
        <h1 className="mt-3 text-4xl font-black">League titles</h1>
        <p className="mt-4 text-slate-500">
          Titles are temporary, priority-based and calculated only from verified match
          statistics. Award snapshots remain in player history after expiry.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {query.data.data.map((title) => (
          <article
            key={title.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <TitleBadge title={title} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black dark:bg-slate-800">
                Priority {title.priority}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">{title.description}</p>
            <div className="mt-5 grid gap-2 text-sm">
              <p className="flex items-center gap-2">
                <CalendarRange size={16} />{" "}
                <strong className="capitalize">
                  {title.periodType.replace("_", " ")}
                </strong>{" "}
                period
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} /> Minimum {title.minimumMatches} verified
                matches
              </p>
              <p className="flex items-center gap-2">
                <Award size={16} /> {title.currentHolderCount} current holder
                {title.currentHolderCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Eligibility ({title.rules.combinator})
              </p>
              <ul className="mt-2 space-y-1 text-sm font-bold">
                {title.rules.conditions.map((condition) => (
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
