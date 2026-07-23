import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { recalculatePeriodicAnalytics } from "@/services/analytics.service.js";
import {
  activateMvpConfig,
  createMvpConfig,
  getMvpConfigs,
  recalculateMvp,
} from "@/services/mvp.service.js";

const defaultWeights = {
  killWeight: 1,
  deathPenalty: 0.35,
  firstPlaceBonus: 15,
  secondPlaceBonus: 8,
  thirdPlaceBonus: 4,
  kdrBonusWeight: 5,
  maximumKdrBonus: 20,
  activityWeight: 1,
  maximumActivityBonus: 10,
};

export function AdminAnalyticsPage() {
  const queryClient = useQueryClient();
  const configsQuery = useQuery({
    queryKey: ["admin-mvp-configs"],
    queryFn: getMvpConfigs,
  });
  const [form, setForm] = useState({
    version: "",
    name: "",
    description: "",
    minimumMatches: 3,
    reason: "Create a reviewed MVP scoring version",
    weights: defaultWeights,
  });

  const createMutation = useMutation({
    mutationFn: createMvpConfig,
    onSuccess: (result) => {
      toast.success(result.message);
      setForm((value) => ({ ...value, version: "", name: "", description: "" }));
      queryClient.invalidateQueries({ queryKey: ["admin-mvp-configs"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const activateMutation = useMutation({
    mutationFn: activateMvpConfig,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalcMutation = useMutation({
    mutationFn: async ({ periodType }) => {
      await recalculatePeriodicAnalytics({
        periodType,
        reason: `Administrator rebuilt ${periodType} analytics after verified-data review`,
      });
      return recalculateMvp({
        awardType: periodType,
        reason: `Administrator recalculated ${periodType} MVP after analytics rebuild`,
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (configsQuery.isPending)
    return <LoadingState title="Loading analytics configuration" />;
  if (configsQuery.isError)
    return (
      <ErrorState
        description={configsQuery.error.message}
        onRetry={() => configsQuery.refetch()}
      />
    );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Calculation governance"
        title="Analytics and MVP controls"
        description="Create immutable scoring versions, activate one formula and explicitly rebuild affected analytics."
        icon={Calculator}
      />

      <SectionCard
        title="Recalculation controls"
        description="Rebuild current verified periods and their MVP award"
      >
        <div className="flex flex-wrap gap-3">
          {["weekly", "monthly", "season", "all_time"].map((periodType) => (
            <button
              key={periodType}
              type="button"
              disabled={recalcMutation.isPending}
              onClick={() => recalcMutation.mutate({ periodType })}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              <RefreshCcw size={17} /> Rebuild {periodType.replace("_", " ")}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Formula versions"
        description="Historical awards retain the formula version and score breakdown used at award time"
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
                    {config.version} · Minimum {config.minimumMatches} matches
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{config.description}</p>
                </div>
                {!config.isActive ? (
                  <button
                    type="button"
                    disabled={activateMutation.isPending}
                    onClick={() =>
                      activateMutation.mutate({
                        configId: config.id,
                        reason: `Activate reviewed scoring formula ${config.version}`,
                      })
                    }
                    className="rounded-xl bg-amber-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
                  >
                    Activate
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(config.weights).map(([key, value]) => (
                  <p
                    key={key}
                    className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
                  >
                    <span className="block text-xs text-slate-500">
                      {key.replaceAll(/([A-Z])/g, " $1")}
                    </span>
                    <strong>{value}</strong>
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Create scoring version"
        description="Existing versions are immutable; changes require a new version"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({
              ...form,
              minimumMatches: Number(form.minimumMatches),
              weights: Object.fromEntries(
                Object.entries(form.weights).map(([key, value]) => [
                  key,
                  Number(value),
                ]),
              ),
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
                placeholder="mvp-v2"
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
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
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
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
              className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            {Object.entries(form.weights).map(([key, value]) => (
              <label key={key} className="grid gap-2 text-sm font-black">
                {key.replaceAll(/([A-Z])/g, " $1")}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weights: { ...current.weights, [key]: event.target.value },
                    }))
                  }
                  className="rounded-xl border px-3 py-3 dark:bg-slate-950"
                />
              </label>
            ))}
          </div>
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
            disabled={createMutation.isPending}
            className="justify-self-start rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create version"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
