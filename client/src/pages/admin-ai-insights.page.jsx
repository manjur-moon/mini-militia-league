import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  getAdminAISummaries,
  getAIStatus,
  regenerateAIInsight,
} from "@/services/ai-insight.service.js";

const initialForm = {
  type: "weekly",
  periodType: "weekly",
  playerId: "",
  matchId: "",
  range: "30d",
  reason: "Regenerate reviewed AI insight from current verified source data",
};

export function AdminAIInsightsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const statusQuery = useQuery({ queryKey: ["admin-ai-status"], queryFn: getAIStatus });
  const historyQuery = useQuery({
    queryKey: ["admin-ai-summaries"],
    queryFn: () => getAdminAISummaries({ page: 1, limit: 30 }),
  });
  const mutation = useMutation({
    mutationFn: regenerateAIInsight,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-ai-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["ai-period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ai-period-highlight"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (historyQuery.isPending || statusQuery.isPending) {
    return <LoadingState title="Loading AI generation controls" />;
  }
  if (historyQuery.isError || statusQuery.isError) {
    const error = historyQuery.error ?? statusQuery.error;
    return (
      <ErrorState description={error.message} onRetry={() => historyQuery.refetch()} />
    );
  }

  const status = statusQuery.data.data;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="AI governance"
        title="Summaries and insight generation"
        description="Review provider status, explicitly regenerate cached narratives and inspect fallback usage."
        icon={Bot}
      />

      <SectionCard
        title="Provider status"
        description="Secrets are never returned by this endpoint"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <p className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
            <span className="block text-xs font-black uppercase text-slate-500">
              Provider
            </span>
            <strong className="mt-2 block">{status.provider}</strong>
          </p>
          <p className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
            <span className="block text-xs font-black uppercase text-slate-500">
              Model
            </span>
            <strong className="mt-2 block">{status.model ?? "Not configured"}</strong>
          </p>
          <p className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
            <span className="block text-xs font-black uppercase text-slate-500">
              Fallback
            </span>
            <strong className="mt-2 flex items-center gap-2">
              <ShieldCheck size={17} /> Always available
            </strong>
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Regenerate insight"
        description="The current cached record is replaced only after explicit admin action and an audit record is created"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const input = { type: form.type, reason: form.reason, range: form.range };
            if (form.type === "highlight") input.periodType = form.periodType;
            if (form.type === "player_performance") input.playerId = form.playerId;
            if (form.type === "match_insight") input.matchId = form.matchId;
            mutation.mutate(input);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-black">
              Insight type
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((value) => ({ ...value, type: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="weekly">Weekly summary</option>
                <option value="monthly">Monthly summary</option>
                <option value="highlight">Period highlight</option>
                <option value="player_performance">Player performance</option>
                <option value="match_insight">Match insight</option>
              </select>
            </label>
            {form.type === "highlight" ? (
              <label className="grid gap-2 text-sm font-black">
                Period
                <select
                  value={form.periodType}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, periodType: event.target.value }))
                  }
                  className="rounded-xl border px-3 py-3 dark:bg-slate-950"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            ) : null}
            {form.type === "player_performance" ? (
              <label className="grid gap-2 text-sm font-black">
                Player ID
                <input
                  required
                  placeholder="MM001"
                  value={form.playerId}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      playerId: event.target.value.toUpperCase(),
                    }))
                  }
                  className="rounded-xl border px-3 py-3 dark:bg-slate-950"
                />
              </label>
            ) : null}
            {form.type === "match_insight" ? (
              <label className="grid gap-2 text-sm font-black md:col-span-2">
                Match MongoDB ID
                <input
                  required
                  value={form.matchId}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, matchId: event.target.value }))
                  }
                  className="rounded-xl border px-3 py-3 dark:bg-slate-950"
                />
              </label>
            ) : null}
          </div>
          <label className="grid gap-2 text-sm font-black">
            Audit reason
            <input
              required
              minLength={5}
              value={form.reason}
              onChange={(event) =>
                setForm((value) => ({ ...value, reason: event.target.value }))
              }
              className="rounded-xl border px-3 py-3 dark:bg-slate-950"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-50"
          >
            <RefreshCcw size={17} />{" "}
            {mutation.isPending ? "Regenerating…" : "Regenerate"}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Generation history"
        description="Source metrics are excluded from this admin list response to keep the payload bounded"
      >
        <div className="grid gap-3">
          {historyQuery.data.data.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black capitalize">
                    {item.type.replaceAll("_", " ")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{item.content}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${item.isFallback ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}`}
                >
                  {item.isFallback ? "Fallback" : (item.model ?? item.provider)}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {new Date(item.generatedAt).toLocaleString()} · {item.promptVersion}
              </p>
            </article>
          ))}
          {!historyQuery.data.data.length ? (
            <p className="text-sm text-slate-500">No generated summaries yet.</p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
