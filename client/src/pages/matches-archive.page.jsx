import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, LoaderCircle, Search, Trash2, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { authClient } from "@/lib/auth-client.js";
import { deleteRejectedMatch, getMatches } from "@/services/match.service.js";

export function MatchesArchivePage({ basePath = "/moderator" }) {
  const queryClient = useQueryClient();
  const session = authClient.useSession();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deferredSearch = useDeferredValue(search);

  const isAdmin = session.data?.user?.role === "admin";

  const query = useQuery({
    queryKey: [
      "matches",
      {
        deferredSearch,
        status,
        page,
      },
    ],

    queryFn: () =>
      getMatches({
        search: deferredSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (matchId) => deleteRejectedMatch(matchId),

    onSuccess: async (result) => {
      const currentPageItemCount = query.data?.data?.length ?? 0;

      toast.success(result?.message ?? "Rejected match deleted successfully.");

      setDeleteTarget(null);

      if (currentPageItemCount === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }

      await queryClient.invalidateQueries({
        queryKey: ["matches"],
      });
    },

    onError: (error) => {
      toast.error(error.message ?? "Unable to delete the rejected match.");
    },
  });

  function openDeleteConfirmation(match) {
    if (!isAdmin) {
      toast.error("Only administrators can delete rejected matches.");

      return;
    }

    if (match.status !== "rejected") {
      toast.error("Only rejected matches can be deleted.");

      return;
    }

    setDeleteTarget(match);
  }

  function closeDeleteConfirmation() {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget?.id) {
      return;
    }

    deleteMutation.mutate(deleteTarget.id);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Evidence archive"
        title="Match screenshots"
        description="Search uploads, monitor OCR status and open pending verification work."
        icon={Archive}
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="search"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Search match code"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <select
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900"
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
          {query.data.data.map((match) => {
            const canDelete = isAdmin && match.status === "rejected";

            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === match.id;

            return (
              <article
                key={match.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-amber-400 sm:p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    to={`${basePath}/matches/${match.id}`}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:items-center"
                  >
                    <img
                      src={match.screenshot.secureUrl}
                      alt={`${match.matchCode} result screenshot`}
                      className="h-20 w-24 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      loading="lazy"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950 dark:text-white">
                        {match.matchCode}
                      </p>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {new Date(match.matchDate).toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {match.participantCount}{" "}
                        {match.participantCount === 1 ? "player" : "players"}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 dark:border-slate-800">
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {match.status.replaceAll("_", " ")}
                    </span>

                    {canDelete ? (
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => openDeleteConfirmation(match)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                        aria-label={`Delete rejected match ${match.matchCode}`}
                      >
                        {isDeleting ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}

                        <span>Delete</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {query.data && !query.data.data.length ? (
        <EmptyState
          title="No matches found"
          description="Upload a screenshot or change the filters."
        />
      ) : null}

      {query.data?.pagination?.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          aria-label="Match archive pagination"
        >
          <button
            type="button"
            disabled={!query.data.pagination.hasPreviousPage || query.isFetching}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Previous
          </button>

          <span className="text-center text-sm font-bold text-slate-600 dark:text-slate-300">
            Page {page} of {query.data.pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!query.data.pagination.hasNextPage || query.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </nav>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-match-title"
            aria-describedby="delete-match-description"
            className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                <Trash2 size={22} />
              </div>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={closeDeleteConfirmation}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                aria-label="Close delete confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="delete-match-title"
              className="mt-5 text-xl font-black text-slate-950 dark:text-white"
            >
              Delete rejected match?
            </h2>

            <p
              id="delete-match-description"
              className="mt-2 leading-6 text-slate-600 dark:text-slate-300"
            >
              The rejected match <strong>{deleteTarget.matchCode}</strong> and its
              related records will be permanently deleted. This action cannot be undone.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={closeDeleteConfirmation}
                className="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-black transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={confirmDelete}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Deleting
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
