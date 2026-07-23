import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { ChallengeProgressCard } from "@/features/challenges/components/challenge-progress-card.jsx";
import { getChallenges } from "@/services/challenge.service.js";

export function ChallengesPage() {
  const [type, setType] = useState("");
  const [lifecycle, setLifecycle] = useState("current");
  const query = useQuery({
    queryKey: ["challenges", type, lifecycle],
    queryFn: () => getChallenges({ type: type || undefined, lifecycle }),
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="League missions"
        title="Weekly and monthly challenges"
        description="Progress is generated from verified match statistics only. Completed challenges preserve their historical target and reward."
        icon={Target}
      />
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
          aria-label="Challenge type"
        >
          <option value="">All types</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select
          value={lifecycle}
          onChange={(event) => setLifecycle(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
          aria-label="Challenge lifecycle"
        >
          <option value="current">Current</option>
          <option value="history">History</option>
          <option value="all">All</option>
        </select>
      </div>
      {query.isPending ? <LoadingState title="Loading challenges" /> : null}
      {query.isError ? (
        <ErrorState
          title="Challenges unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data ? (
        query.data.data.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {query.data.data.map((challenge) => (
              <ChallengeProgressCard key={challenge.id} item={challenge} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
            No challenges match the selected filters.
          </p>
        )
      ) : null}
    </section>
  );
}
