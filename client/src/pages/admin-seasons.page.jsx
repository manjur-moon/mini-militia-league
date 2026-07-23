import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Database, Pencil, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { SeasonStatusBadge } from "@/features/seasons/components/season-status-badge.jsx";
import {
  backfillSeasonMatches,
  changeSeasonStatus,
  createSeason,
  getAdminSeasons,
  recalculateSeason,
  updateSeason,
} from "@/services/season.service.js";

const emptyForm = Object.freeze({
  name: "",
  slug: "",
  description: "",
  startAt: "",
  endAt: "",
  timezone: "UTC",
  status: "draft",
  reason: "Create an approved league season schedule.",
});

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPayload(form) {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    timezone: form.timezone,
    status: form.status,
    reason: form.reason,
  };
}

export function AdminSeasonsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const query = useQuery({
    queryKey: ["admin-seasons"],
    queryFn: () =>
      getAdminSeasons({ page: 1, limit: 100, sortBy: "startAt", sortOrder: "desc" }),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] }),
      queryClient.invalidateQueries({ queryKey: ["seasons"] }),
      queryClient.invalidateQueries({ queryKey: ["season-statistics"] }),
      queryClient.invalidateQueries({ queryKey: ["season-leaderboard"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createSeason,
    onSuccess: async (result) => {
      toast.success(result.message);
      setForm({ ...emptyForm });
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: updateSeason,
    onSuccess: async (result) => {
      toast.success(result.message);
      setEditingId(null);
      setForm({ ...emptyForm });
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const statusMutation = useMutation({
    mutationFn: changeSeasonStatus,
    onSuccess: async (result) => {
      toast.success(result.message);
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalculateMutation = useMutation({
    mutationFn: recalculateSeason,
    onSuccess: async (result) => {
      toast.success(result.message);
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const backfillMutation = useMutation({
    mutationFn: backfillSeasonMatches,
    onSuccess: async (result) => {
      toast.success(`${result.message} ${result.data.updatedMatches} matches updated.`);
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const seasons = useMemo(() => query.data?.data ?? [], [query.data]);
  const activeSeason = useMemo(
    () => seasons.find((season) => season.status === "active") ?? null,
    [seasons],
  );

  function submit(event) {
    event.preventDefault();
    const payload = toPayload(form);
    if (editingId) {
      const updates = { ...payload };
      delete updates.status;
      updateMutation.mutate({ seasonId: editingId, ...updates });
    } else {
      createMutation.mutate(payload);
    }
  }

  function edit(season) {
    setEditingId(season.id);
    setForm({
      name: season.name,
      slug: season.slug,
      description: season.description,
      startAt: toLocalInput(season.startAt),
      endAt: toLocalInput(season.endAt),
      timezone: season.timezone,
      status: season.status,
      reason: "Update the approved season schedule.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeStatus(season, status, reason) {
    statusMutation.mutate({ seasonId: season.id, status, reason });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="League governance"
        title="Season management"
        description="Control season schedules, lifecycle transitions, verified-match assignment and immutable final results."
        icon={CalendarRange}
      />

      {activeSeason ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Active season
          </p>
          <p className="mt-2 text-2xl font-black">{activeSeason.name}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {new Date(activeSeason.startAt).toLocaleString()} –{" "}
            {new Date(activeSeason.endAt).toLocaleString()}
          </p>
        </div>
      ) : null}

      <SectionCard
        title={editingId ? "Edit season" : "Create season"}
        description="Draft seasons may overlap; upcoming and active schedules may not overlap another scheduled season"
      >
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {[
            ["name", "Season name", "Season 1"],
            ["slug", "URL slug", "season-1"],
            ["timezone", "IANA timezone", "UTC"],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="grid gap-2 text-sm font-black">
              {label}
              <input
                value={form[key]}
                placeholder={placeholder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                required
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          ))}
          {!editingId ? (
            <label className="grid gap-2 text-sm font-black">
              Initial status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-black">
            Start date and time
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, startAt: event.target.value }))
              }
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black">
            End date and time
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, endAt: event.target.value }))
              }
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Audit reason
            <input
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({ ...current, reason: event.target.value }))
              }
              required
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {editingId ? "Save season" : "Create season"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...emptyForm });
                }}
                className="rounded-xl border border-slate-300 px-5 py-3 font-black dark:border-slate-700"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Season archive"
        description="Lifecycle actions are protected by server-side transition rules"
      >
        {query.isPending ? <LoadingState title="Loading season management" /> : null}
        {query.isError ? (
          <ErrorState
            title="Season management unavailable"
            description={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : null}
        {query.data ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Season</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Finalization</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {seasons.map((season) => (
                  <tr key={season.id}>
                    <td className="p-3">
                      <p className="font-black">{season.name}</p>
                      <p className="text-xs text-slate-500">/{season.slug}</p>
                    </td>
                    <td className="p-3 text-xs">
                      <p>{new Date(season.startAt).toLocaleString()}</p>
                      <p>{new Date(season.endAt).toLocaleString()}</p>
                    </td>
                    <td className="p-3">
                      <SeasonStatusBadge status={season.status} />
                    </td>
                    <td className="p-3 text-xs font-bold">
                      {season.finalization?.status ?? "not_started"}
                    </td>
                    <td className="p-3">
                      <div className="flex min-w-60 flex-wrap gap-2">
                        {["draft", "upcoming"].includes(season.status) ? (
                          <button
                            type="button"
                            onClick={() => edit(season)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black dark:border-slate-700"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        ) : null}
                        {season.status === "draft" ? (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                season,
                                "upcoming",
                                "Publish the approved season schedule.",
                              )
                            }
                            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-black text-white"
                          >
                            Publish
                          </button>
                        ) : null}
                        {season.status === "upcoming" ? (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                season,
                                "active",
                                "Start the season inside its approved schedule window.",
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                          >
                            Activate
                          </button>
                        ) : null}
                        {season.status === "active" ? (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                season,
                                "completed",
                                "Complete and finalize the active season.",
                              )
                            }
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950"
                          >
                            Complete
                          </button>
                        ) : null}
                        {["active", "completed"].includes(season.status) ? (
                          <button
                            type="button"
                            onClick={() =>
                              recalculateMutation.mutate({
                                seasonId: season.id,
                                reason:
                                  "Recalculate the season from current verified match data.",
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black dark:border-slate-700"
                          >
                            <RefreshCcw size={14} /> Recalculate
                          </button>
                        ) : null}
                        {["upcoming", "active", "completed"].includes(season.status) ? (
                          <button
                            type="button"
                            onClick={() =>
                              backfillMutation.mutate({
                                seasonId: season.id,
                                reason:
                                  "Assign unlinked matches whose dates fall inside this season.",
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black dark:border-slate-700"
                          >
                            <Database size={14} /> Backfill
                          </button>
                        ) : null}
                        {season.status === "completed" &&
                        season.finalization?.status === "completed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                season,
                                "archived",
                                "Archive the finalized season snapshot.",
                              )
                            }
                            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white"
                          >
                            Archive
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
