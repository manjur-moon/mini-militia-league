import { useQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { ShareActions } from "@/features/sharing/components/share-actions.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import {
  getActiveMvpConfig,
  getCurrentMvp,
  getMvpAwards,
} from "@/services/mvp.service.js";
import { getWeeklyMvpShare } from "@/services/social-sharing.service.js";

export function MvpPage() {
  const [awardType, setAwardType] = useState("weekly");
  const currentQuery = useQuery({
    queryKey: ["current-mvp-page", awardType],
    queryFn: () => getCurrentMvp({ awardType }),
  });
  const historyQuery = useQuery({
    queryKey: ["mvp-history", awardType],
    queryFn: () => getMvpAwards({ awardType, status: "current", page: 1, limit: 12 }),
  });
  const configQuery = useQuery({
    queryKey: ["active-mvp-config"],
    queryFn: getActiveMvpConfig,
  });
  const weeklyShareQuery = useQuery({
    queryKey: ["weekly-mvp-share"],
    queryFn: () => getWeeklyMvpShare(),
    enabled: awardType === "weekly" && Boolean(currentQuery.data?.data?.award),
    staleTime: 5 * 60 * 1000,
  });

  if (currentQuery.isPending || historyQuery.isPending || configQuery.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <LoadingState title="Loading MVP awards" />
      </div>
    );
  }
  if (currentQuery.isError || historyQuery.isError || configQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <ErrorState
          description={
            currentQuery.error?.message ??
            historyQuery.error?.message ??
            configQuery.error?.message
          }
        />
      </div>
    );
  }

  const award = currentQuery.data.data.award;
  const config = configQuery.data.data;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            Official awards
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Most valuable players
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {["weekly", "monthly", "season", "all_time"].map((value) => (
            <button
              key={value}
              onClick={() => setAwardType(value)}
              className={`rounded-xl px-4 py-2 font-black capitalize ${awardType === value ? "bg-amber-500 text-slate-950" : "border border-slate-300 dark:border-slate-700"}`}
            >
              {value.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <article className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white">
        <div className="flex flex-col gap-7 md:flex-row md:items-center">
          <span className="grid size-28 place-items-center overflow-hidden rounded-[2rem] bg-amber-500 text-5xl font-black text-slate-950">
            {award?.player?.photoUrl ? (
              <img
                src={award.player.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              (award?.player?.name?.slice(0, 1) ?? <Crown size={52} />)
            )}
          </span>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              {currentQuery.data.data.period.label}
            </p>
            <h2 className="mt-2 text-4xl font-black">
              {award?.player?.name ?? "No eligible MVP"}
            </h2>
            {award ? (
              <p className="mt-3 text-slate-300">
                {award.player.playerId} · {award.score.toFixed(2)} points · Formula{" "}
                {award.formulaVersion}
              </p>
            ) : (
              <p className="mt-3 text-slate-300">
                The configured minimum-match threshold has not been met.
              </p>
            )}
          </div>
          {award ? (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/players/${award.player.playerId}`}
                className="rounded-xl bg-white px-4 py-3 font-black text-slate-950"
              >
                View player
              </Link>
              {awardType === "weekly" && weeklyShareQuery.data?.data ? (
                <ShareActions
                  data={weeklyShareQuery.data.data}
                  downloadFilename="weekly-mvp-champion.png"
                  compact
                />
              ) : null}
            </div>
          ) : null}
        </div>
        {award ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Kill score", award.scoreBreakdown.killScore],
              ["Death penalty", `-${award.scoreBreakdown.deathPenalty}`],
              ["Placement", award.scoreBreakdown.placementBonus],
              ["KDR bonus", award.scoreBreakdown.kdrBonus],
              ["Activity", award.scoreBreakdown.activityAdjustment],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" />
            <h2 className="text-2xl font-black">Active formula</h2>
          </div>
          <p className="mt-3 text-slate-500">{config.description}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Version</dt>
              <dd className="font-black">{config.version}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Minimum matches</dt>
              <dd className="font-black">{config.minimumMatches}</dd>
            </div>
            {Object.entries(config.weights).map(([key, value]) => (
              <div key={key}>
                <dt className="text-slate-500">{key.replaceAll(/([A-Z])/g, " $1")}</dt>
                <dd className="font-black">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-500" />
            <h2 className="text-2xl font-black">Award history</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {historyQuery.data.data.map((item) => (
              <Link
                key={item.id}
                to={`/players/${item.player.playerId}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-amber-400 dark:border-slate-800"
              >
                <div>
                  <p className="font-black">{item.player.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.periodKey} · {item.formulaVersion}
                  </p>
                </div>
                <span className="font-black">{item.score.toFixed(2)}</span>
              </Link>
            ))}
            {!historyQuery.data.data.length ? (
              <p className="text-slate-500">No awards have been generated yet.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
