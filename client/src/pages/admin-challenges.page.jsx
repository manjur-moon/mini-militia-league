import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  changeChallengeStatus,
  createChallenge,
  getAdminChallenges,
  recalculateChallenges,
} from "@/services/challenge.service.js";

const initialForm = {
  code: "",
  version: "1.0.0",
  name: "",
  description: "",
  icon: "🎯",
  type: "weekly",
  status: "draft",
  startAt: "",
  endAt: "",
  metric: "totalKills",
  targetOperator: "gte",
  targetValue: "100",
  minimumMatches: "1",
  rewardName: "Challenge Badge",
  rewardDescription: "Awarded for completing the challenge.",
  reason: "Create a new league challenge.",
};

export function AdminChallengesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [reason, setReason] = useState(
    "Recalculate challenge progress from verified statistics.",
  );
  const query = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: () => getAdminChallenges({ page: 1, limit: 100 }),
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    queryClient.invalidateQueries({ queryKey: ["challenges"] });
    queryClient.invalidateQueries({ queryKey: ["player-challenges"] });
  };
  const createMutation = useMutation({
    mutationFn: createChallenge,
    onSuccess: (result) => {
      toast.success(result.message);
      setForm(initialForm);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const statusMutation = useMutation({
    mutationFn: changeChallengeStatus,
    onSuccess: (result) => {
      toast.success(result.message);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const recalcMutation = useMutation({
    mutationFn: recalculateChallenges,
    onSuccess: (result) => {
      toast.success(result.message);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event) {
    event.preventDefault();
    createMutation.mutate({
      code: form.code,
      version: form.version,
      name: form.name,
      description: form.description,
      icon: form.icon,
      type: form.type,
      status: form.status,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      metric: form.metric,
      targetOperator: form.targetOperator,
      targetValue: Number(form.targetValue),
      minimumMatches: Number(form.minimumMatches),
      minimumEligibility: null,
      reward: {
        name: form.rewardName,
        badgeIcon: form.icon,
        description: form.rewardDescription,
      },
      reason: form.reason,
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="League missions"
        title="Challenge management"
        description="Manage weekly and monthly targets, rewards, lifecycle and verified-statistics progress."
        icon={Target}
      />

      <SectionCard
        title="Boundary rule"
        description="Custom start and end times must match the configured league week or month exactly"
      >
        <p className="text-sm text-slate-500">
          Dates are stored in UTC and resolved using the league timezone. Historical
          challenge snapshots remain unchanged after completion.
        </p>
      </SectionCard>

      <SectionCard
        title="Recalculate progress"
        description="Rebuild progress from verified periodic statistics"
      >
        <label className="grid gap-2 text-sm font-black">
          Audit reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <button
          type="button"
          disabled={recalcMutation.isPending || reason.trim().length < 5}
          onClick={() => recalcMutation.mutate({ reason })}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          <RefreshCcw size={17} /> Recalculate challenges
        </button>
      </SectionCard>

      <SectionCard
        title="Create custom challenge"
        description="Use a unique code and an exact league period"
      >
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {[
            ["code", "Code", "WEEKLY_CUSTOM_2026_W30"],
            ["version", "Version", "1.0.0"],
            ["name", "Name", "Custom mission"],
            ["icon", "Icon", "🎯"],
            ["startAt", "Start (UTC)", "2026-07-20T00:00"],
            ["endAt", "End (UTC)", "2026-07-27T00:00"],
            ["targetValue", "Target value", "100"],
            ["minimumMatches", "Minimum matches", "1"],
            ["rewardName", "Reward name", "Challenge Badge"],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="grid gap-2 text-sm font-black">
              {label}
              <input
                type={
                  key === "targetValue" || key === "minimumMatches" ? "number" : "text"
                }
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
          <label className="grid gap-2 text-sm font-black">
            Type
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            Metric
            <select
              value={form.metric}
              onChange={(event) =>
                setForm((current) => ({ ...current, metric: event.target.value }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="totalKills">Total kills</option>
              <option value="firstPlaceCount">First places</option>
              <option value="kdr">KDR</option>
              <option value="mvpCount">MVP awards</option>
              <option value="matchesPlayed">Matches played</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              required
              className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Reward description
            <input
              value={form.rewardDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rewardDescription: event.target.value,
                }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
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
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50 md:col-span-2"
          >
            Create challenge
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Challenge archive"
        description="System defaults and custom challenge instances"
      >
        {query.isPending ? <LoadingState title="Loading challenge management" /> : null}
        {query.isError ? (
          <ErrorState
            title="Challenges unavailable"
            description={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : null}
        {query.data ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Challenge</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {query.data.data.map((challenge) => (
                  <tr key={challenge.id}>
                    <td className="p-3">
                      <p className="font-black">
                        {challenge.icon} {challenge.name}
                      </p>
                      <p className="text-xs text-slate-500">{challenge.code}</p>
                    </td>
                    <td className="p-3">
                      {challenge.type}
                      <p className="text-xs text-slate-500">
                        {new Date(challenge.startAt).toLocaleDateString()} –{" "}
                        {new Date(challenge.endAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-3">
                      {challenge.targetOperator} {challenge.targetValue}{" "}
                      {challenge.metric}
                    </td>
                    <td className="p-3 font-black">{challenge.status}</td>
                    <td className="p-3">
                      {challenge.status === "draft" ? (
                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({
                              challengeId: challenge.id,
                              status: "upcoming",
                              reason: "Publish approved challenge schedule.",
                            })
                          }
                          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-950"
                        >
                          Publish
                        </button>
                      ) : challenge.status === "active" ? (
                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({
                              challengeId: challenge.id,
                              status: "completed",
                              reason: "Close the active challenge period.",
                            })
                          }
                          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950"
                        >
                          Complete
                        </button>
                      ) : null}
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
