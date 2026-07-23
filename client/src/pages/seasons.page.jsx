import { useQuery } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SeasonCard } from "@/features/seasons/components/season-card.jsx";
import { getSeasons } from "@/services/season.service.js";

export function SeasonsPage() {
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["seasons", status],
    queryFn: () =>
      getSeasons({
        status: status || undefined,
        page: 1,
        limit: 50,
        sortBy: "startAt",
        sortOrder: "desc",
      }),
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="League archive"
        title="Seasons"
        description="Explore active and historical league seasons. Official rankings use verified match results only."
        icon={CalendarRange}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="grid max-w-xs gap-2 text-sm font-black">
          Season status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All seasons</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      {query.isPending ? <LoadingState title="Loading seasons" /> : null}
      {query.isError ? (
        <ErrorState
          title="Seasons unavailable"
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data?.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.data.map((season) => (
            <SeasonCard key={season.id} season={season} />
          ))}
        </div>
      ) : query.data ? (
        <EmptyState
          title="No seasons found"
          description="No season matches the selected lifecycle state."
        />
      ) : null}
    </section>
  );
}
