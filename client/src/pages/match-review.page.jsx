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

import { OcrScanningPreview } from "@/components/match/ocr-scanning-preview.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { authClient } from "@/lib/auth-client.js";
import {
  assignDenseKillPlacements,
  validateMatchReviewRows,
} from "@/lib/dense-kill-ranking.js";
import { getPlayers } from "@/services/player.service.js";
import {
  approveMatchRevision,
  getMatch,
  getMatchRevisions,
  proposeMatchRevision,
  rejectMatch,
  rejectMatchRevision,
  retryOCR,
  saveMatchReview,
  verifyMatch,
} from "@/services/match.service.js";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950";

function toEditableRows(results = []) {
  return results
    .filter((row) => row.status !== "rejected")
    .map((row) => ({
      resultId: row.id,

      playerId:
        row.official?.playerId ??
        row.corrected?.playerId ??
        row.playerMatch?.suggestedPlayerId ??
        "",

      kills: row.official?.kills ?? row.corrected?.kills ?? row.extracted?.kills ?? 0,

      deaths:
        row.official?.deaths ?? row.corrected?.deaths ?? row.extracted?.deaths ?? 0,

      placement:
        row.official?.placement ??
        row.corrected?.placement ??
        row.extracted?.placement ??
        null,

      sourceName:
        row.official?.playerName ??
        row.corrected?.playerName ??
        row.extracted?.playerName ??
        "Unknown OCR row",

      confidence: row.extracted?.confidence ?? 0,

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

  const ocrStatus = detail?.ocrJob?.status ?? "";

  const isOcrScanning = ["queued", "processing"].includes(ocrStatus);

  const revisionsQuery = useQuery({
    queryKey: ["match-revisions", matchId],

    queryFn: () =>
      getMatchRevisions(matchId, {
        page: 1,
        limit: 20,
      }),

    enabled: Boolean(matchId && verified),
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

      const combinedPlayers = [...(active.data ?? []), ...(inactive.data ?? [])];

      const uniquePlayers = [
        ...new Map(combinedPlayers.map((player) => [player.id, player])).values(),
      ];

      return {
        data: uniquePlayers,
      };
    },
  });

  useEffect(() => {
    if (detail?.results) {
      setRows(toEditableRows(detail.results));
    }
  }, [detail?.results]);

  const players = playersQuery.data?.data ?? [];

  const terminal = ["verified", "rejected"].includes(detail?.match?.status);

  const editable = !terminal || (verified && isAdmin && correctionMode);

  const rankedRows = useMemo(() => assignDenseKillPlacements(rows), [rows]);

  const reviewValidation = useMemo(() => validateMatchReviewRows(rows), [rows]);

  const validationMessage = reviewValidation.errors[0] ?? null;

  const canVerify = reviewValidation.isValid && !terminal && !isOcrScanning;

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

      if (type === "retry") {
        return retryOCR(payload.jobId);
      }

      throw new Error("Unsupported match action.");
    },

    onSuccess: async (result) => {
      toast.success(result?.message ?? "Match updated successfully.");

      setCorrectionMode(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["match", matchId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["matches"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["match-revisions", matchId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["player-profile"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["public-matches"],
        }),
      ]);
    },

    onError: (error) => {
      toast.error(error.message ?? "Unable to update the match.");
    },
  });

  function updateRow(index, key, value) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  }

  function removeRow(index) {
    setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));
  }

  function normalizedRows() {
    return rankedRows.map((row) => ({
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
    if (isOcrScanning) {
      toast.error("Wait for OCR scanning to finish.");

      return;
    }

    if (!reviewValidation.isValid) {
      toast.error(validationMessage ?? "Review rows are incomplete.");

      return;
    }

    mutation.mutate({
      type: "review",

      payload: {
        matchId,
        matchDate: detail.match.matchDate,
        timezone: detail.match.timezone,
        participantCount: rankedRows.length,
        reason,

        rows: normalizedRows().map((row) => ({
          ...row,
          reason: "Confirmed during screenshot review",
        })),
      },
    });
  }

  function verifyCurrentMatch() {
    if (isOcrScanning) {
      toast.error("Wait for OCR scanning to finish.");

      return;
    }

    if (!reviewValidation.isValid) {
      toast.error(validationMessage ?? "Review rows are incomplete.");

      return;
    }

    mutation.mutate({
      type: "verify",

      payload: {
        matchId,
        reason,
      },
    });
  }

  function rejectCurrentMatch() {
    if (reason.trim().length < 3) {
      toast.error("Provide a valid rejection reason.");

      return;
    }

    mutation.mutate({
      type: "reject",

      payload: {
        matchId,
        reason,
      },
    });
  }

  function proposeCorrection() {
    if (!reviewValidation.isValid) {
      toast.error(validationMessage ?? "Correction rows are incomplete.");

      return;
    }

    if (rankedRows.some((row) => !row.resultId)) {
      toast.error("Every correction row must reference an existing official result.");

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

          participantCount: rankedRows.length,

          seasonId: detail.match.seasonId ?? null,
        },

        results: normalizedRows(),
      },
    });
  }

  function cancelCorrection() {
    setCorrectionMode(false);

    setRows(toEditableRows(detail?.results ?? []));

    setReason("Admin correction required for verified match data");
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

  if (!detail?.match) {
    return (
      <ErrorState
        description="Match details are unavailable."
        onRetry={() => matchQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={detail.match.matchCode}
        title={verified ? "Verified match" : "OCR verification"}
        description={
          verified
            ? "Official results are locked. Admin corrections require a versioned proposal and approval."
            : "Compare the preserved screenshot with every row. Only the corrected snapshot can be verified."
        }
        icon={verified ? ShieldCheck : ScanLine}
        action={
          <button
            type="button"
            onClick={() => navigate(archivePath)}
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-bold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Back to archive
          </button>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <a
            href={detail.match.screenshot.secureUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open original match screenshot"
            className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <OcrScanningPreview
              imageUrl={detail.match.screenshot.secureUrl}
              alt="Original Mini Militia result screenshot"
              isScanning={isOcrScanning}
              status={ocrStatus}
              provider={detail.ocrJob?.provider}
            />
          </a>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-2">
              <p>
                <strong>Match status:</strong>{" "}
                {detail.match.status.replaceAll("_", " ")}
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
            </div>

            {isOcrScanning ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 p-3 font-bold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200">
                <ScanLine size={17} className="shrink-0" />

                <span>
                  OCR scanning is in progress. Results will update automatically.
                </span>
              </div>
            ) : null}

            {detail.ocrJob?.errorHistory?.length ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {detail.ocrJob.errorHistory.at(-1).message}
              </p>
            ) : null}

            {detail.ocrJob?.status === "failed" &&
            detail.ocrJob.attempts < detail.ocrJob.maxAttempts ? (
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    type: "retry",

                    payload: {
                      jobId: detail.ocrJob.id,
                    },
                  })
                }
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  size={16}
                  className={mutation.isPending ? "animate-spin" : ""}
                />
                Retry OCR
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
            <p className="font-black">Automatic kill-based placement</p>

            <p className="mt-1 leading-6">
              Placement is calculated automatically from kills. Players with equal kills
              receive the same placement. Deaths do not break ties.
            </p>
          </div>

          {isOcrScanning && !rankedRows.length ? (
            <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/60 p-8 text-center dark:border-cyan-900 dark:bg-cyan-950/20">
              <ScanLine
                size={34}
                className="mx-auto animate-pulse text-cyan-600 dark:text-cyan-300"
              />

              <p className="mt-4 font-black text-slate-950 dark:text-white">
                Scanning screenshot
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Player names, kills and deaths will appear here after OCR processing
                finishes.
              </p>
            </div>
          ) : null}

          {rankedRows.map((row, index) => (
            <article
              key={row.resultId ?? `manual-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black">{row.sourceName}</p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    OCR confidence: {Math.round((row.confidence ?? 0) * 100)}%
                    {row.warnings.length ? ` · ${row.warnings.join(", ")}` : ""}
                  </p>
                </div>

                {!terminal ? (
                  <button
                    type="button"
                    disabled={mutation.isPending || isOcrScanning}
                    onClick={() => removeRow(index)}
                    aria-label={`Exclude ${row.sourceName}`}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={17} />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.5fr)_repeat(3,minmax(80px,100px))]">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Player
                  </span>

                  <select
                    className={inputClass}
                    value={row.playerId}
                    disabled={!editable || isOcrScanning}
                    onChange={(event) =>
                      updateRow(index, "playerId", event.target.value)
                    }
                  >
                    <option value="">Select registered player</option>

                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.playerId} — {player.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Kills
                  </span>

                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-label="Kills"
                    value={row.kills}
                    disabled={!editable || isOcrScanning}
                    onChange={(event) => updateRow(index, "kills", event.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Deaths
                  </span>

                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-label="Deaths"
                    value={row.deaths}
                    disabled={!editable || isOcrScanning}
                    onChange={(event) => updateRow(index, "deaths", event.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Placement
                  </span>

                  <input
                    className={`${inputClass} cursor-not-allowed bg-slate-100 font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200`}
                    type="number"
                    min="1"
                    aria-label="Calculated placement"
                    title="Placement is calculated automatically from kills."
                    value={row.placement ?? ""}
                    disabled
                    readOnly
                  />
                </label>
              </div>
            </article>
          ))}

          {!terminal && !isOcrScanning ? (
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() =>
                setRows((currentRows) => [
                  ...currentRows,

                  {
                    playerId: "",
                    kills: 0,
                    deaths: 0,
                    sourceName: "Manual row",
                    confidence: 1,
                    warnings: [],
                  },
                ])
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-slate-400 px-4 py-2 font-bold transition hover:border-amber-500 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-amber-950/20"
            >
              <Plus size={17} />
              Add missing row
            </button>
          ) : null}

          <label className="block text-sm font-bold">
            {verified ? "Correction reason" : "Review reason"}

            <textarea
              className={`${inputClass} mt-2 min-h-24 resize-y`}
              value={reason}
              disabled={isOcrScanning || (terminal && !correctionMode)}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>

          {!reviewValidation.isValid && !isOcrScanning ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {reviewValidation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          {!terminal ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={
                  mutation.isPending || isOcrScanning || !reviewValidation.isValid
                }
                onClick={saveReview}
                className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 font-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Save review
              </button>

              <button
                type="button"
                disabled={mutation.isPending || !canVerify}
                onClick={verifyCurrentMatch}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShieldCheck size={18} />
                Verify match
              </button>

              <button
                type="button"
                disabled={
                  mutation.isPending || isOcrScanning || reason.trim().length < 3
                }
                onClick={rejectCurrentMatch}
                className="min-h-11 rounded-xl bg-red-600 px-4 py-2.5 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 transition hover:bg-amber-400"
                >
                  <PencilLine size={18} />
                  Propose verified correction
                </button>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={
                      mutation.isPending ||
                      !reviewValidation.isValid ||
                      rankedRows.some((row) => !row.resultId) ||
                      reason.trim().length < 5
                    }
                    onClick={proposeCorrection}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <PencilLine size={18} />
                    Submit correction proposal
                  </button>

                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={cancelCorrection}
                    className="min-h-11 rounded-xl border border-slate-400 px-4 py-2.5 font-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-900"
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

          {revisionsQuery.isError ? (
            <ErrorState
              description={revisionsQuery.error.message}
              onRetry={() => revisionsQuery.refetch()}
            />
          ) : null}

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

                    <p className="mt-1 text-sm text-slate-500">{revision.reason}</p>

                    <p className="mt-2 text-xs font-bold uppercase tracking-wide">
                      {revision.status}
                    </p>
                  </div>

                  {revision.status === "proposed" && isAdmin ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : !revisionsQuery.isPending && !revisionsQuery.isError ? (
            <p className="text-sm text-slate-500">No correction revisions exist.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
