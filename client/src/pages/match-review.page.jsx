import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  PencilLine,
  Plus,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { authClient } from "@/lib/auth-client.js";
import {
  approveMatchRevision,
  deleteRejectedMatch,
  getMatch,
  getMatchRevisions,
  proposeMatchRevision,
  rejectMatch,
  rejectMatchRevision,
  retryOCR,
  saveMatchReview,
  verifyMatch,
} from "@/services/match.service.js";
import { getPlayers } from "@/services/player.service.js";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950";

function toEditableRows(results) {
  return results
    .filter((row) => row.status !== "rejected")
    .map((row) => ({
      resultId: row.id,
      playerId:
        row.official?.playerId ??
        row.corrected?.playerId ??
        row.playerMatch?.suggestedPlayerId ??
        "",
      kills: row.official?.kills ?? row.corrected?.kills ?? row.extracted.kills,
      deaths: row.official?.deaths ?? row.corrected?.deaths ?? row.extracted.deaths,
      placement:
        row.official?.placement ?? row.corrected?.placement ?? row.extracted.placement,
      sourceName:
        row.official?.playerName ??
        row.corrected?.playerName ??
        row.extracted.playerName,
      confidence: row.extracted.confidence,
      warnings: row.validationWarnings ?? [],
    }));
}

export function MatchReviewPage({ archivePath = "/moderator/archive" }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const session = authClient.useSession();
  const isAdmin = session.data?.user?.role === "admin";

  const [rows, setRows] = useState([]);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reason, setReason] = useState(
    "Moderator verified screenshot against corrected rows",
  );

  const matchQuery = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
    enabled: Boolean(matchId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.ocrJob?.status;

      return ["queued", "processing"].includes(status) ? 2500 : false;
    },
  });

  const detail = matchQuery.data?.data;

  const verified = detail?.match?.status === "verified";

  const rejected = detail?.match?.status === "rejected";

  const revisionsQuery = useQuery({
    queryKey: ["match-revisions", matchId],
    queryFn: () =>
      getMatchRevisions(matchId, {
        page: 1,
        limit: 20,
      }),
    enabled: Boolean(verified && matchId),
  });

  const playersQuery = useQuery({
    queryKey: ["review-player-options"],
    queryFn: async () => {
      const [active, inactive] = await Promise.all([
        getPlayers({
          status: "active",
          page: 1,
          limit: 50,
          sortBy: "name",
          sortOrder: "asc",
        }),
        getPlayers({
          status: "inactive",
          page: 1,
          limit: 50,
          sortBy: "name",
          sortOrder: "asc",
        }),
      ]);

      return {
        data: [...active.data, ...inactive.data],
      };
    },
  });

  useEffect(() => {
    if (detail?.results) {
      setRows(toEditableRows(detail.results));
    }
  }, [detail]);

  const players = playersQuery.data?.data ?? [];

  const terminal = ["verified", "rejected"].includes(detail?.match?.status);

  const editable = !terminal || (verified && isAdmin && correctionMode);

  const canVerify = rows.length >= 2 && rows.every((row) => row.playerId) && !terminal;

  const openRevision = revisionsQuery.data?.data?.find(
    (revision) => revision.status === "proposed",
  );

  const mutation = useMutation({
    mutationFn: ({ type, payload }) => {
      if (type === "review") {
        return saveMatchReview(payload);
      }

      if (type === "verify") {
        return verifyMatch(payload);
      }

      if (type === "reject") {
        return rejectMatch(payload);
      }

      if (type === "correction") {
        return proposeMatchRevision(payload);
      }

      if (type === "approve-revision") {
        return approveMatchRevision(payload);
      }

      if (type === "reject-revision") {
        return rejectMatchRevision(payload);
      }

      return retryOCR(payload.jobId);
    },

    onSuccess: (result) => {
      toast.success(result.message);
      setCorrectionMode(false);

      queryClient.invalidateQueries({
        queryKey: ["match", matchId],
      });

      queryClient.invalidateQueries({
        queryKey: ["matches"],
      });

      queryClient.invalidateQueries({
        queryKey: ["match-revisions", matchId],
      });

      queryClient.invalidateQueries({
        queryKey: ["player-profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["public-matches"],
      });
    },

    onError: (error) => {
      toast.error(error.message ?? "Unable to update the match.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRejectedMatch(matchId),

    onSuccess: async (result) => {
      toast.success(result.message ?? "Rejected match deleted successfully.");

      setDeleteDialogOpen(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["matches"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["public-matches"],
        }),
      ]);

      navigate(archivePath, {
        replace: true,
      });
    },

    onError: (error) => {
      toast.error(error.message ?? "Unable to delete the rejected match.");
    },
  });

  const duplicateProblem = useMemo(() => {
    const playerIds = rows.map((row) => row.playerId).filter(Boolean);

    const placements = rows.map((row) => Number(row.placement));

    return (
      new Set(playerIds).size !== playerIds.length ||
      new Set(placements).size !== placements.length
    );
  }, [rows]);

  const placementSequenceProblem = useMemo(() => {
    const ordered = rows
      .map((row) => Number(row.placement))
      .sort((left, right) => left - right);

    return ordered.some((placement, index) => placement !== index + 1);
  }, [rows]);

  function updateRow(index, key, value) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  }

  function normalizedRows() {
    return rows.map((row) => ({
      ...(row.resultId
        ? {
            resultId: row.resultId,
          }
        : {}),
      playerId: row.playerId,
      kills: Number(row.kills),
      deaths: Number(row.deaths),
      placement: Number(row.placement),
    }));
  }

  function saveReview() {
    if (duplicateProblem || placementSequenceProblem) {
      toast.error("Players must be unique and placements must run from 1 to N.");

      return;
    }

    mutation.mutate({
      type: "review",
      payload: {
        matchId,
        matchDate: detail.match.matchDate,
        timezone: detail.match.timezone,
        participantCount: rows.length,
        reason,
        rows: normalizedRows().map((row) => ({
          ...row,
          reason: "Confirmed during screenshot review",
        })),
      },
    });
  }

  function proposeCorrection() {
    if (
      duplicateProblem ||
      placementSequenceProblem ||
      rows.some((row) => !row.resultId)
    ) {
      toast.error("Every official row, player and sequential placement is required.");

      return;
    }

    mutation.mutate({
      type: "correction",
      payload: {
        matchId,
        reason,
        expectedRevision: detail.match.currentRevision,
        matchChanges: {
          matchDate: detail.match.matchDate,
          timezone: detail.match.timezone,
          participantCount: rows.length,
          seasonId: detail.match.seasonId ?? null,
        },
        results: normalizedRows(),
      },
    });
  }

  if (matchQuery.isPending) {
    return <LoadingState title="Loading match review" />;
  }

  if (matchQuery.isError) {
    return (
      <ErrorState
        description={matchQuery.error.message}
        onRetry={() => matchQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={detail.match.matchCode}
        title={
          verified ? "Verified match" : rejected ? "Rejected match" : "OCR verification"
        }
        description={
          verified
            ? "Official results are locked. Admin corrections require a versioned proposal and approval."
            : rejected
              ? "This match was rejected and is excluded from official statistics."
              : "Compare the preserved screenshot with every row. Only the corrected snapshot can be verified."
        }
        icon={verified ? ShieldCheck : rejected ? XCircle : ScanLine}
        action={
          <button
            type="button"
            onClick={() => navigate(archivePath)}
            className="rounded-xl border border-slate-300 px-4 py-2 font-bold dark:border-slate-700"
          >
            Back to archive
          </button>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <a href={detail.match.screenshot.secureUrl} target="_blank" rel="noreferrer">
            <img
              src={detail.match.screenshot.secureUrl}
              alt="Original Mini Militia result screenshot"
              className="w-full rounded-2xl border border-slate-200 object-contain dark:border-slate-800"
            />
          </a>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p>
              <strong>Match status:</strong> {detail.match.status.replaceAll("_", " ")}
            </p>

            <p>
              <strong>Official revision:</strong> {detail.match.currentRevision}
            </p>

            <p>
              <strong>Statistics:</strong>{" "}
              {detail.match.statisticsRecalculation?.status?.replaceAll("_", " ") ??
                "not started"}
            </p>

            <p>
              <strong>OCR status:</strong> {detail.ocrJob?.status ?? "Unavailable"}
            </p>

            <p>
              <strong>Provider:</strong> {detail.ocrJob?.provider ?? "Unavailable"}
            </p>

            <p>
              <strong>Attempts:</strong> {detail.ocrJob?.attempts ?? 0}/
              {detail.ocrJob?.maxAttempts ?? 0}
            </p>

            {rejected && detail.match.verification?.rejectionReason ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <p className="font-black">Rejection reason</p>

                <p className="mt-1">{detail.match.verification.rejectionReason}</p>
              </div>
            ) : null}

            {detail.ocrJob?.errorHistory?.length ? (
              <p className="mt-2 text-red-600">
                {detail.ocrJob.errorHistory.at(-1).message}
              </p>
            ) : null}

            {detail.ocrJob?.status === "failed" &&
            detail.ocrJob.attempts < detail.ocrJob.maxAttempts ? (
              <button
                type="button"
                onClick={() =>
                  mutation.mutate({
                    type: "retry",
                    payload: {
                      jobId: detail.ocrJob.id,
                    },
                  })
                }
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-bold dark:border-slate-700"
              >
                <RefreshCw size={16} />
                Retry OCR
              </button>
            ) : null}

            {rejected && isAdmin ? (
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteDialogOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />
                Delete rejected match
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <article
              key={row.resultId ?? `manual-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{row.sourceName}</p>

                  <p className="text-xs text-slate-500">
                    OCR confidence: {Math.round((row.confidence ?? 0) * 100)}%{" "}
                    {row.warnings.length ? `· ${row.warnings.join(", ")}` : ""}
                  </p>
                </div>

                {!terminal ? (
                  <button
                    type="button"
                    onClick={() =>
                      setRows((current) =>
                        current.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                    aria-label="Exclude row"
                  >
                    <Trash2 size={17} />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.5fr_repeat(3,90px)]">
                <select
                  className={inputClass}
                  value={row.playerId}
                  disabled={!editable}
                  onChange={(event) => updateRow(index, "playerId", event.target.value)}
                >
                  <option value="">Select registered player</option>

                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.playerId} — {player.name}
                    </option>
                  ))}
                </select>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  aria-label="Kills"
                  value={row.kills}
                  disabled={!editable}
                  onChange={(event) => updateRow(index, "kills", event.target.value)}
                />

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  aria-label="Deaths"
                  value={row.deaths}
                  disabled={!editable}
                  onChange={(event) => updateRow(index, "deaths", event.target.value)}
                />

                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  aria-label="Placement"
                  value={row.placement}
                  disabled={!editable}
                  onChange={(event) =>
                    updateRow(index, "placement", event.target.value)
                  }
                />
              </div>
            </article>
          ))}

          {!terminal ? (
            <button
              type="button"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    playerId: "",
                    kills: 0,
                    deaths: 0,
                    placement: current.length + 1,
                    sourceName: "Manual row",
                    confidence: 1,
                    warnings: [],
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-400 px-4 py-2 font-bold"
            >
              <Plus size={17} />
              Add missing row
            </button>
          ) : null}

          {!rejected ? (
            <label className="block text-sm font-bold">
              {verified ? "Correction reason" : "Review reason"}

              <textarea
                className={`${inputClass} mt-2 min-h-24`}
                value={reason}
                disabled={terminal && !correctionMode}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          ) : null}

          {duplicateProblem || placementSequenceProblem ? (
            <p className="text-sm font-bold text-red-600">
              Players must be unique and placements must form the sequence 1 to{" "}
              {rows.length}.
            </p>
          ) : null}

          {!terminal ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  mutation.isPending || duplicateProblem || placementSequenceProblem
                }
                onClick={saveReview}
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-black disabled:opacity-40 dark:border-slate-700"
              >
                Save review
              </button>

              <button
                type="button"
                disabled={
                  mutation.isPending ||
                  !canVerify ||
                  duplicateProblem ||
                  placementSequenceProblem
                }
                onClick={() =>
                  mutation.mutate({
                    type: "verify",
                    payload: {
                      matchId,
                      reason,
                    },
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-40"
              >
                <ShieldCheck size={18} />
                Verify match
              </button>

              <button
                type="button"
                disabled={mutation.isPending || reason.trim().length < 3}
                onClick={() =>
                  mutation.mutate({
                    type: "reject",
                    payload: {
                      matchId,
                      reason,
                    },
                  })
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 font-black text-white disabled:opacity-40"
              >
                Reject match
              </button>
            </div>
          ) : null}

          {verified && isAdmin && !openRevision ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              {!correctionMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionMode(true);

                    setReason("Admin correction required for verified match data");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950"
                >
                  <PencilLine size={18} />
                  Propose verified correction
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      mutation.isPending ||
                      duplicateProblem ||
                      placementSequenceProblem ||
                      reason.trim().length < 5
                    }
                    onClick={proposeCorrection}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-40"
                  >
                    <PencilLine size={18} />
                    Submit correction proposal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCorrectionMode(false);

                      setRows(toEditableRows(detail.results));
                    }}
                    className="rounded-xl border border-slate-400 px-4 py-2.5 font-black"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {verified ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Correction history
            </p>

            <h2 className="mt-2 text-2xl font-black">Verified revisions</h2>
          </div>

          {revisionsQuery.isPending ? <LoadingState title="Loading revisions" /> : null}

          {revisionsQuery.data?.data?.length ? (
            <div className="grid gap-3">
              {revisionsQuery.data.data.map((revision) => (
                <article
                  key={revision.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                >
                  <div>
                    <p className="font-black">
                      Revision proposal #{revision.revisionNumber}
                    </p>

                    <p className="text-sm text-slate-500">{revision.reason}</p>

                    <p className="mt-1 text-xs font-bold uppercase">
                      {revision.status}
                    </p>
                  </div>

                  {revision.status === "proposed" && isAdmin ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() =>
                          mutation.mutate({
                            type: "approve-revision",
                            payload: {
                              matchId,
                              revisionNumber: revision.revisionNumber,
                              expectedMatchRevision: detail.match.currentRevision,
                              approvalReason: reason,
                            },
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-slate-950"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={mutation.isPending || reason.trim().length < 5}
                        onClick={() =>
                          mutation.mutate({
                            type: "reject-revision",
                            payload: {
                              matchId,
                              revisionNumber: revision.revisionNumber,
                              reason,
                            },
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No correction revisions exist.</p>
          )}
        </section>
      ) : null}

      {deleteDialogOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteMutation.isPending) {
              setDeleteDialogOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-rejected-match-title"
            aria-describedby="delete-rejected-match-description"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
              <Trash2 size={24} aria-hidden="true" />
            </div>

            <h2 id="delete-rejected-match-title" className="mt-5 text-2xl font-black">
              Delete rejected match?
            </h2>

            <p
              id="delete-rejected-match-description"
              className="mt-3 text-sm leading-6 text-slate-500"
            >
              This will permanently remove the match screenshot and OCR data. This
              action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-black transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />

                {deleteMutation.isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
