import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  activateTitleDefinition,
  createTitleDefinition,
  createTitleRevision,
  deactivateTitleDefinition,
  getTitleDefinitions,
  recalculateTitles,
} from "@/services/title.service.js";

const initialRule = JSON.stringify(
  {
    combinator: "all",
    conditions: [{ metric: "totalKills", operator: "gte", value: 100 }],
  },
  null,
  2,
);
const initialForm = {
  code: "",
  version: "v1",
  name: "",
  description: "",
  icon: "★",
  periodType: "weekly",
  minimumMatches: 5,
  priority: 50,
  durationDays: 7,
  rulesJson: initialRule,
  reason: "Create a reviewed dynamic-title definition.",
};

export function AdminTitlesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const definitionsQuery = useQuery({
    queryKey: ["admin-title-definitions"],
    queryFn: () => getTitleDefinitions({ page: 1, limit: 100 }),
  });
  const parsedRules = useMemo(() => {
    try {
      return { value: JSON.parse(form.rulesJson), error: null };
    } catch (error) {
      return { value: null, error: error.message };
    }
  }, [form.rulesJson]);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-title-definitions"] });
  const createMutation = useMutation({
    mutationFn: createTitleDefinition,
    onSuccess: () => {
      toast.success("Title definition created");
      setForm(initialForm);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const activateMutation = useMutation({
    mutationFn: activateTitleDefinition,
    onSuccess: () => {
      toast.success("Title activated");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const deactivateMutation = useMutation({
    mutationFn: deactivateTitleDefinition,
    onSuccess: () => {
      toast.success("Title deactivated");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const revisionMutation = useMutation({
    mutationFn: createTitleRevision,
    onSuccess: () => {
      toast.success("Immutable revision created");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalculateMutation = useMutation({
    mutationFn: recalculateTitles,
    onSuccess: (result) => {
      toast.success(`Evaluated ${result.data.evaluatedPlayers} players`);
      queryClient.invalidateQueries({ queryKey: ["dynamic-titles"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (definitionsQuery.isPending)
    return <LoadingState title="Loading dynamic-title administration" />;
  if (definitionsQuery.isError)
    return (
      <ErrorState
        title="Title management unavailable"
        description={definitionsQuery.error.message}
        onRetry={() => definitionsQuery.refetch()}
      />
    );
  const definitions = definitionsQuery.data.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Extended V1"
        title="Dynamic titles"
        description="Version rules, assign one priority winner per player and preserve every award snapshot."
      />
      <SectionCard
        title="Recalculate current titles"
        description="Uses verified periodic statistics and revokes awards that no longer qualify"
      >
        <button
          type="button"
          disabled={recalculateMutation.isPending}
          onClick={() =>
            recalculateMutation.mutate({
              reason:
                "Recalculate current dynamic-title eligibility after verified analytics updates.",
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          <RefreshCcw size={17} />{" "}
          {recalculateMutation.isPending ? "Evaluating…" : "Evaluate all active titles"}
        </button>
      </SectionCard>
      <SectionCard
        title="Active and historical definitions"
        description="Activating a revision deactivates the previous version with the same code"
      >
        <div className="grid gap-4">
          {definitions.map((title) => (
            <article
              key={title.id}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">
                      {title.icon} {title.name}
                    </h3>
                    {title.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={13} /> Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {title.code} · {title.version} ·{" "}
                    {title.periodType.replace("_", " ")} · priority {title.priority}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{title.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {title.isActive ? (
                    <button
                      type="button"
                      onClick={() =>
                        deactivateMutation.mutate({
                          titleId: title.id,
                          reason: `Deactivate ${title.code} ${title.version} after admin review.`,
                        })
                      }
                      className="rounded-xl border px-3 py-2 text-sm font-black"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        activateMutation.mutate({
                          titleId: title.id,
                          reason: `Activate reviewed definition ${title.code} ${title.version}.`,
                        })
                      }
                      className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-black text-slate-950"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const version = window.prompt(
                        "New immutable version",
                        `${title.version}-rev2`,
                      );
                      if (version)
                        revisionMutation.mutate({
                          titleId: title.id,
                          input: {
                            version,
                            reason: `Create reviewed revision ${version} from ${title.code} ${title.version}.`,
                          },
                        });
                    }}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                  >
                    Create revision
                  </button>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                {title.rules.conditions.map((rule) => (
                  <li
                    key={`${rule.metric}-${rule.operator}`}
                    className="rounded-xl bg-slate-100 px-3 py-2 font-bold dark:bg-slate-800"
                  >
                    {rule.metric} {rule.operator} {rule.value}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Create title definition"
        description="New definitions start inactive and require explicit activation"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsedRules.error) return toast.error(parsedRules.error);
            createMutation.mutate({
              ...form,
              minimumMatches: Number(form.minimumMatches),
              priority: Number(form.priority),
              durationDays: Number(form.durationDays),
              rules: parsedRules.value,
              code: form.code.toUpperCase(),
              rulesJson: undefined,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              placeholder="TITLE_CODE"
              value={form.code}
              onChange={(event) =>
                setForm((value) => ({ ...value, code: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <input
              required
              placeholder="v1"
              value={form.version}
              onChange={(event) =>
                setForm((value) => ({ ...value, version: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <input
              required
              placeholder="Title name"
              value={form.name}
              onChange={(event) =>
                setForm((value) => ({ ...value, name: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
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
          <div className="grid gap-4 md:grid-cols-5">
            <input
              value={form.icon}
              onChange={(event) =>
                setForm((value) => ({ ...value, icon: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <select
              value={form.periodType}
              onChange={(event) =>
                setForm((value) => ({ ...value, periodType: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="season">Season</option>
              <option value="all_time">All time</option>
            </select>
            <input
              type="number"
              min="1"
              value={form.minimumMatches}
              onChange={(event) =>
                setForm((value) => ({ ...value, minimumMatches: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <input
              type="number"
              min="1"
              value={form.priority}
              onChange={(event) =>
                setForm((value) => ({ ...value, priority: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
            <input
              type="number"
              min="1"
              value={form.durationDays}
              onChange={(event) =>
                setForm((value) => ({ ...value, durationDays: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
          </div>
          <textarea
            value={form.rulesJson}
            onChange={(event) =>
              setForm((value) => ({ ...value, rulesJson: event.target.value }))
            }
            className="min-h-52 rounded-xl border px-3 py-3 font-mono text-xs dark:bg-slate-950"
            spellCheck="false"
          />
          <input
            required
            value={form.reason}
            onChange={(event) =>
              setForm((value) => ({ ...value, reason: event.target.value }))
            }
            className="rounded-xl border px-3 py-3 dark:bg-slate-950"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || Boolean(parsedRules.error)}
            className="justify-self-start rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
          >
            Create inactive definition
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
