import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  activateAchievementDefinition,
  createAchievementDefinition,
  createAchievementRevision,
  deactivateAchievementDefinition,
  getAchievementDefinitions,
  recalculateAchievements,
} from "@/services/achievement.service.js";

const initialForm = {
  code: "",
  version: "v1",
  name: "",
  description: "",
  icon: "🏅",
  category: "milestone",
  periodType: "all_time",
  minimumMatches: "1",
  progressMetric: "totalKills",
  targetValue: "100",
  criteriaJson:
    '{"combinator":"all","conditions":[{"metric":"totalKills","operator":"gte","value":100}]}',
  reason: "Create a reviewed achievement definition.",
};

export function AdminAchievementsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const parsedCriteria = useMemo(() => {
    try {
      return { value: JSON.parse(form.criteriaJson), error: null };
    } catch {
      return { value: null, error: "Criteria JSON is invalid." };
    }
  }, [form.criteriaJson]);
  const query = useQuery({
    queryKey: ["admin-achievement-definitions"],
    queryFn: () => getAchievementDefinitions({ page: 1, limit: 100 }),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-achievement-definitions"] });
    queryClient.invalidateQueries({ queryKey: ["achievements"] });
  };
  const createMutation = useMutation({
    mutationFn: createAchievementDefinition,
    onSuccess: () => {
      toast.success("Achievement definition created");
      setForm(initialForm);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const activateMutation = useMutation({
    mutationFn: activateAchievementDefinition,
    onSuccess: () => {
      toast.success("Achievement activated");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const deactivateMutation = useMutation({
    mutationFn: deactivateAchievementDefinition,
    onSuccess: () => {
      toast.success("Achievement deactivated");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const revisionMutation = useMutation({
    mutationFn: createAchievementRevision,
    onSuccess: () => {
      toast.success("Immutable achievement revision created");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalculateMutation = useMutation({
    mutationFn: recalculateAchievements,
    onSuccess: (result) => {
      toast.success(`${result.data.newlyUnlocked} achievement unlocks created`);
      queryClient.invalidateQueries({ queryKey: ["player-achievements"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isPending)
    return <LoadingState title="Loading achievement administration" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Achievement management unavailable"
        description={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Extended V1"
        title="Achievements"
        description="Version achievement rules, preserve unlocked snapshots and evaluate progress from verified statistics."
      />
      <SectionCard
        title="Recalculate achievements"
        description="Runs every active rule against current verified statistics"
      >
        <button
          type="button"
          disabled={recalculateMutation.isPending}
          onClick={() =>
            recalculateMutation.mutate({
              reason:
                "Recalculate all active achievements after verified analytics updates.",
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          <RefreshCcw size={17} />
          {recalculateMutation.isPending ? "Evaluating…" : "Evaluate all achievements"}
        </button>
      </SectionCard>
      <SectionCard
        title="Active and historical definitions"
        description="Unlocked player snapshots are never rewritten by a later rule version"
      >
        <div className="grid gap-4">
          {query.data.data.map((achievement) => (
            <article
              key={achievement.id}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">
                      {achievement.icon} {achievement.name}
                    </h3>
                    {achievement.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={13} /> Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {achievement.code} · {achievement.version} · {achievement.category}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {achievement.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      (achievement.isActive
                        ? deactivateMutation
                        : activateMutation
                      ).mutate({
                        achievementId: achievement.id,
                        reason: `${achievement.isActive ? "Deactivate" : "Activate"} ${achievement.code} ${achievement.version} after admin review.`,
                      })
                    }
                    className={
                      achievement.isActive
                        ? "rounded-xl border px-3 py-2 text-sm font-black"
                        : "rounded-xl bg-amber-500 px-3 py-2 text-sm font-black text-slate-950"
                    }
                  >
                    {achievement.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const version = window.prompt(
                        "New immutable version",
                        `${achievement.version}-rev2`,
                      );
                      if (version) {
                        revisionMutation.mutate({
                          achievementId: achievement.id,
                          input: {
                            version,
                            reason: `Create reviewed revision ${version} from ${achievement.code} ${achievement.version}.`,
                          },
                        });
                      }
                    }}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                  >
                    Create revision
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Create achievement definition"
        description="New definitions start inactive and require explicit activation"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsedCriteria.error) return toast.error(parsedCriteria.error);
            createMutation.mutate({
              code: form.code.toUpperCase(),
              version: form.version,
              name: form.name,
              description: form.description,
              icon: form.icon,
              category: form.category,
              periodType: form.periodType,
              minimumMatches: Number(form.minimumMatches),
              progressMetric: form.progressMetric,
              targetValue: Number(form.targetValue),
              criteria: parsedCriteria.value,
              reason: form.reason,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["code", "ACHIEVEMENT_CODE"],
              ["version", "v1"],
              ["name", "Achievement name"],
              ["icon", "🏅"],
              ["category", "milestone"],
              ["progressMetric", "totalKills"],
            ].map(([name, placeholder]) => (
              <input
                key={name}
                required
                placeholder={placeholder}
                value={form[name]}
                onChange={(event) =>
                  setForm((value) => ({ ...value, [name]: event.target.value }))
                }
                className="rounded-xl border px-3 py-3 dark:bg-slate-950"
              />
            ))}
          </div>
          <textarea
            required
            placeholder="Description"
            value={form.description}
            onChange={(event) =>
              setForm((value) => ({ ...value, description: event.target.value }))
            }
            className="min-h-20 rounded-xl border px-3 py-3 dark:bg-slate-950"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={form.periodType}
              onChange={(event) =>
                setForm((value) => ({ ...value, periodType: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            >
              <option value="all_time">All time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="season">Season</option>
            </select>
            <input
              type="number"
              min="0"
              value={form.minimumMatches}
              onChange={(event) =>
                setForm((value) => ({ ...value, minimumMatches: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <input
              type="number"
              min="0.000001"
              step="any"
              value={form.targetValue}
              onChange={(event) =>
                setForm((value) => ({ ...value, targetValue: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
          </div>
          <textarea
            value={form.criteriaJson}
            onChange={(event) =>
              setForm((value) => ({ ...value, criteriaJson: event.target.value }))
            }
            className="min-h-32 rounded-xl border px-3 py-3 font-mono text-sm dark:bg-slate-950"
          />
          <textarea
            required
            value={form.reason}
            onChange={(event) =>
              setForm((value) => ({ ...value, reason: event.target.value }))
            }
            className="min-h-20 rounded-xl border px-3 py-3 dark:bg-slate-950"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-black text-white dark:bg-white dark:text-slate-950"
          >
            {createMutation.isPending ? "Creating…" : "Create inactive definition"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
