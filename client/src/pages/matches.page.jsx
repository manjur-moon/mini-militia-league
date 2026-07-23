import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search, ShieldCheck, Users } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { getMatches } from "@/services/match.service.js";

export function MatchesPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["public-matches", { deferredSearch, page }],
    queryFn: () =>
      getMatches({
        search: deferredSearch || undefined,
        page,
        limit: 12,
        sortBy: "matchDate",
        sortOrder: "desc",
      }),
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          Verified evidence
        </p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Match history</h1>
        <p className="mt-4 text-lg text-slate-500">
          Only moderator-verified screenshots and official result rows appear here.
        </p>
      </div>

      <label className="relative block max-w-xl">
        <Search className="absolute left-3 top-3.5 text-slate-400" size={19} />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search match code"
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      {query.isPending ? <LoadingState title="Loading verified matches" /> : null}
      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}
      {query.data?.data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.data.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-video overflow-hidden bg-slate-950">
                <img
                  src={match.screenshot.secureUrl}
                  alt={`${match.matchCode} verified result`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-black">{match.matchCode}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={14} /> Verified
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {new Date(match.matchDate).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users size={16} /> {match.participantCount} players
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {query.data && !query.data.data.length ? (
        <EmptyState
          title="No verified matches found"
          description="Try another match code or return after a moderator verifies a result."
        />
      ) : null}
      {query.data?.pagination?.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={!query.data.pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 font-bold disabled:opacity-40 dark:border-slate-700"
          >
            Previous
          </button>
          <span className="text-sm font-bold">
            Page {query.data.pagination.page} of {query.data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!query.data.pagination.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 font-bold disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
