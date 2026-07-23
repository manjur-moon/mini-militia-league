import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  activateRatingConfig,
  createRatingConfig,
  getRatingConfigs,
  recalculateRatings,
} from "@/services/rating.service.js";

const defaultFormula = {
  components: [
    {
      component: "attack",
      metrics: [
        { metric: "averageKills", method: "target", target: 25, weight: 0.45 },
        { metric: "kdr", method: "target", target: 1.5, weight: 0.35 },
        { metric: "winRate", method: "target", target: 40, weight: 0.2 },
      ],
    },
    {
      component: "survival",
      metrics: [
        { metric: "averageDeaths", method: "inverse_target", target: 25, weight: 0.45 },
        { metric: "averageRank", method: "inverse_target", target: 2, weight: 0.35 },
        { metric: "lastPlaceRate", method: "inverse_target", target: 20, weight: 0.2 },
      ],
    },
    {
      component: "consistency",
      metrics: [
        {
          metric: "killsCoefficientOfVariation",
          method: "inverse_target",
          target: 0.35,
          weight: 0.55,
        },
        {
          metric: "placementStandardDeviation",
          method: "inverse_target",
          target: 1.25,
          weight: 0.45,
        },
      ],
    },
    {
      component: "activity",
      metrics: [
        { metric: "matchesPlayed", method: "target", target: 10, weight: 0.7 },
        { metric: "activeDays", method: "target", target: 5, weight: 0.3 },
      ],
    },
  ],
  overallWeights: { attack: 0.35, survival: 0.25, consistency: 0.25, activity: 0.15 },
};

export function AdminRatingsPage() {
  const queryClient = useQueryClient();
  const configsQuery = useQuery({
    queryKey: ["admin-rating-configs"],
    queryFn: getRatingConfigs,
  });
  const [form, setForm] = useState({
    version: "",
    name: "",
    description: "",
    minimumMatches: 5,
    newPlayerConfidenceFloor: 0.25,
    reason: "Create a reviewed player-rating formula version",
    formulaJson: JSON.stringify(defaultFormula, null, 2),
  });

  const parsedFormula = useMemo(() => {
    try {
      return { value: JSON.parse(form.formulaJson), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  }, [form.formulaJson]);

  const createMutation = useMutation({
    mutationFn: createRatingConfig,
    onSuccess: (result) => {
      toast.success(result.message);
      setForm((value) => ({ ...value, version: "", name: "", description: "" }));
      queryClient.invalidateQueries({ queryKey: ["admin-rating-configs"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const activateMutation = useMutation({
    mutationFn: activateRatingConfig,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalculateMutation = useMutation({
    mutationFn: ({ periodType }) =>
      recalculateRatings({
        periodType,
        reason: `Administrator recalculated ${periodType} ratings after verified-data review`,
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (configsQuery.isPending) return <LoadingState title="Loading rating governance" />;
  if (configsQuery.isError) {
    return (
      <ErrorState
        description={configsQuery.error.message}
        onRetry={() => configsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Formula governance"
        title="Player rating controls"
        description="Create immutable rating versions, activate one formula and explicitly rebuild verified periods."
        icon={Calculator}
      />

      <SectionCard
        title="Recalculation controls"
        description="Rebuild ratings with the active formula"
      >
        <div className="flex flex-wrap gap-3">
          {["weekly", "monthly", "season", "all_time"].map((periodType) => (
            <button
              key={periodType}
              type="button"
              disabled={recalculateMutation.isPending}
              onClick={() => recalculateMutation.mutate({ periodType })}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              <RefreshCcw size={17} /> Rebuild {periodType.replace("_", " ")}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Rating versions"
        description="Historical calculations preserve their formula version"
      >
        <div className="grid gap-4">
          {configsQuery.data.data.map((config) => (
            <article
              key={config.id}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">{config.name}</h3>
                    {config.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={13} /> Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {config.version} · minimum {config.minimumMatches} matches ·
                    confidence floor {Math.round(config.newPlayerConfidenceFloor * 100)}
                    %
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{config.description}</p>
                </div>
                {!config.isActive ? (
                  <button
                    type="button"
                    disabled={activateMutation.isPending}
                    onClick={() =>
                      activateMutation.mutate({
                        configId: config.version,
                        reason: `Activate reviewed rating formula ${config.version}`,
                      })
                    }
                    className="rounded-xl bg-amber-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
                  >
                    Activate
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {config.components.map((component) => (
                  <div
                    key={component.component}
                    className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"
                  >
                    <p className="font-black capitalize">{component.component}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Overall weight{" "}
                      {Math.round(config.overallWeights[component.component] * 100)}%
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {component.metrics.map((metric) => (
                        <li key={metric.metric}>
                          {metric.metric} · {Math.round(metric.weight * 100)}%
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Create rating version"
        description="Changes require a new immutable version"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsedFormula.error) {
              toast.error(`Formula JSON is invalid: ${parsedFormula.error}`);
              return;
            }
            createMutation.mutate({
              version: form.version,
              name: form.name,
              description: form.description,
              minimumMatches: Number(form.minimumMatches),
              newPlayerConfidenceFloor: Number(form.newPlayerConfidenceFloor),
              components: parsedFormula.value.components,
              overallWeights: parsedFormula.value.overallWeights,
              reason: form.reason,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Version
              <input
                required
                value={form.version}
                onChange={(event) =>
                  setForm((value) => ({ ...value, version: event.target.value }))
                }
                placeholder="rating-v2"
                className="rounded-xl border px-3 py-3 dark:bg-slate-950"
              />
            </label>
            <label className="grid gap-2 text-sm font-black">
              Name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((value) => ({ ...value, name: event.target.value }))
                }
                className="rounded-xl border px-3 py-3 dark:bg-slate-950"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-black">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((value) => ({ ...value, description: event.target.value }))
              }
              className="min-h-20 rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Minimum matches
              <input
                type="number"
                min="1"
                max="100"
                value={form.minimumMatches}
                onChange={(event) =>
                  setForm((value) => ({ ...value, minimumMatches: event.target.value }))
                }
                className="rounded-xl border px-3 py-3 dark:bg-slate-950"
              />
            </label>
            <label className="grid gap-2 text-sm font-black">
              New-player confidence floor
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={form.newPlayerConfidenceFloor}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    newPlayerConfidenceFloor: event.target.value,
                  }))
                }
                className="rounded-xl border px-3 py-3 dark:bg-slate-950"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-black">
            Components and weights JSON
            <textarea
              value={form.formulaJson}
              onChange={(event) =>
                setForm((value) => ({ ...value, formulaJson: event.target.value }))
              }
              className="min-h-[28rem] rounded-xl border px-3 py-3 font-mono text-xs dark:bg-slate-950"
              spellCheck="false"
            />
            {parsedFormula.error ? (
              <span className="text-xs font-bold text-red-600">
                {parsedFormula.error}
              </span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-black">
            Reason
            <input
              required
              value={form.reason}
              onChange={(event) =>
                setForm((value) => ({ ...value, reason: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
          </label>
          <button
            type="submit"
            disabled={createMutation.isPending || Boolean(parsedFormula.error)}
            className="justify-self-start rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create rating version"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
