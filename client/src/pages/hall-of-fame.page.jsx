import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { HallOfFameRecordCard } from "@/features/hall-of-fame/components/hall-of-fame-record-card.jsx";
import { getHallOfFame } from "@/services/hall-of-fame.service.js";

export function HallOfFamePage() {
  const [status, setStatus] = useState("current");
  const [category, setCategory] = useState("");
  const query = useQuery({
    queryKey: ["hall-of-fame", status, category],
    queryFn: () =>
      getHallOfFame({
        status,
        category: category || undefined,
        limit: 100,
      }),
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Historical excellence"
        title="Hall of Fame"
        description="Versioned league records calculated only from verified match data. Superseded records remain visible as immutable history."
        icon={Crown}
      />

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black">
          Record status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="current">Current records</option>
            <option value="historical">Historical records</option>
            <option value="all">All records</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All categories</option>
            <option value="season_champion">Season Champion</option>
            <option value="all_time_legend">All-Time Legend</option>
            <option value="most_kills">Most Kills</option>
            <option value="most_mvp_awards">Most MVP Awards</option>
            <option value="best_kdr">Best KDR</option>
            <option value="longest_winning_streak">Longest Winning Streak</option>
          </select>
        </label>
      </div>

      {query.isPending ? <LoadingState title="Loading Hall of Fame" /> : null}
      {query.isError ? (
        <ErrorState
          title="Hall of Fame unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data?.data?.items?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.data.items.map((record) => (
            <HallOfFameRecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : null}
      {query.data && !query.data.data.items.length ? (
        <EmptyState
          title="No Hall of Fame records yet"
          description="Records appear after verified statistics are recalculated and eligible players exist."
        />
      ) : null}
    </section>
  );
}
