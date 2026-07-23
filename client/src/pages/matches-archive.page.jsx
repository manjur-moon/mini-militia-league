import { useQuery } from "@tanstack/react-query";
import { Archive, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { getMatches } from "@/services/match.service.js";

export function MatchesArchivePage({ basePath = "/moderator" }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["matches", { deferredSearch, status, page }],
    queryFn: () =>
      getMatches({
        search: deferredSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Evidence archive"
        title="Match screenshots"
        description="Search uploads, monitor OCR status and open pending verification work."
        icon={Archive}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Search match code"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          className="rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {[
            "uploaded",
            "processing",
            "needs_review",
            "processing_failed",
            "verified",
            "rejected",
          ].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {query.isPending ? <LoadingState title="Loading matches" /> : null}
      {query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : null}
      {query.data?.data?.length ? (
        <div className="grid gap-4">
          {query.data.data.map((match) => (
            <Link
              key={match.id}
              to={`${basePath}/matches/${match.id}`}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-amber-400 sm:grid-cols-[96px_1fr_auto] dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={match.screenshot.secureUrl}
                alt="Match result screenshot"
                className="h-20 w-24 rounded-xl object-cover"
                loading="lazy"
              />
              <div>
                <p className="font-black">{match.matchCode}</p>
                <p className="text-sm text-slate-500">
                  {new Date(match.matchDate).toLocaleString()} ·{" "}
                  {match.participantCount} players
                </p>
              </div>
              <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase dark:bg-slate-800">
                {match.status.replaceAll("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      {query.data && !query.data.data.length ? (
        <EmptyState
          title="No matches found"
          description="Upload a screenshot or change the filters."
        />
      ) : null}
      {query.data?.pagination?.totalPages > 1 ? (
        <div className="flex justify-between">
          <button
            disabled={!query.data.pagination.hasPreviousPage}
            onClick={() => setPage((v) => v - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={!query.data.pagination.hasNextPage}
            onClick={() => setPage((v) => v + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
