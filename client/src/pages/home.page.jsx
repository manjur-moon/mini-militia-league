import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Camera,
  Crown,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { HealthStatusCard } from "@/features/health/health-status-card.jsx";
import { getPeriodAnalytics } from "@/services/analytics.service.js";
import { getPeriodAISummary } from "@/services/ai-insight.service.js";
import { getMatches } from "@/services/match.service.js";
import { getCurrentMvp } from "@/services/mvp.service.js";
import { getPlayers } from "@/services/player.service.js";

const workflow = [
  {
    title: "Upload",
    description: "Moderators securely upload an original match screenshot.",
    icon: Camera,
  },
  {
    title: "Verify",
    description: "OCR results are reviewed, corrected and matched to players.",
    icon: ShieldCheck,
  },
  {
    title: "Analyze",
    description: "Verified results update official rankings and performance trends.",
    icon: BarChart3,
  },
];

async function getHomeAnalytics() {
  const [players, matches, weekly, mvp, aiSummary] = await Promise.all([
    getPlayers({ page: 1, limit: 1 }),
    getMatches({
      status: "verified",
      page: 1,
      limit: 4,
      sortBy: "matchDate",
      sortOrder: "desc",
    }),
    getPeriodAnalytics("weekly"),
    getCurrentMvp({ awardType: "weekly" }),
    getPeriodAISummary("weekly"),
  ]);
  return {
    playerCount: players.pagination.totalItems,
    recentMatches: matches.data,
    weekly: weekly.data,
    mvp: mvp.data.award,
    aiSummary: aiSummary.data,
  };
}

export function HomePage() {
  const query = useQuery({
    queryKey: ["public-home-analytics"],
    queryFn: getHomeAnalytics,
    retry: 1,
  });
  const data = query.data;
  const previewStats = [
    { label: "Registered players", value: data?.playerCount ?? "—", icon: Users },
    {
      label: "Verified matches this week",
      value: data?.weekly?.totals?.verifiedMatches ?? "—",
      icon: ShieldCheck,
    },
    {
      label: "Weekly MVP",
      value: data?.mvp?.player?.name ?? "Pending",
      icon: Crown,
    },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 hero-grid opacity-50" aria-hidden="true" />
        <div
          className="absolute left-1/2 top-10 size-[28rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Sparkles size={14} aria-hidden="true" /> Competitive gaming analytics
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Turn every verified battle into a league legacy.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Upload Mini Militia result screenshots, verify OCR-extracted results and
              transform trustworthy match data into rankings, MVP awards and performance
              analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/leaderboards"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400"
              >
                View leaderboards <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-black transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Open dashboard
              </Link>
            </div>
            <div className="mt-8 max-w-xl">
              <HealthStatusCard />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/30">
            <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-5 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                  Weekly champion
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {data?.mvp?.player?.name ?? "MVP awaits eligible matches"}
                </h2>
                {data?.mvp ? (
                  <p className="mt-1 text-sm text-slate-400">
                    {data.mvp.player.playerId} · {data.mvp.score.toFixed(2)} points
                  </p>
                ) : null}
              </div>
              <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-amber-500 text-slate-950">
                {data?.mvp?.player?.photoUrl ? (
                  <img
                    src={data.mvp.player.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Trophy size={28} aria-hidden="true" />
                )}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {previewStats.map(({ label, value, icon: Icon }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <Icon size={19} className="text-amber-500" aria-hidden="true" />
                  <p className="mt-4 truncate text-xl font-black">{value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">Top players this week</p>
                <Link
                  to="/analytics"
                  className="text-sm font-black text-amber-700 dark:text-amber-300"
                >
                  Full analytics
                </Link>
              </div>
              <div className="mt-3 grid gap-2">
                {data?.weekly?.topPlayers?.map((entry) => (
                  <Link
                    key={entry.player.id}
                    to={`/players/${entry.player.playerId}`}
                    className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
                  >
                    <span className="font-bold">
                      #{entry.rank} {entry.player.name}
                    </span>
                    <strong>{entry.performanceScore.toFixed(2)}</strong>
                  </Link>
                ))}
                {!data?.weekly?.topPlayers?.length ? (
                  <p className="text-sm text-slate-500">No eligible players yet.</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                  AI weekly summary
                </p>
                <Link
                  to="/insights"
                  className="text-xs font-black text-violet-700 dark:text-violet-300"
                >
                  View insights
                </Link>
              </div>
              <h3 className="mt-2 text-lg font-black">
                {data?.aiSummary?.structuredContent?.headline ??
                  "Verified-data summary"}
              </h3>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {data?.aiSummary?.content ??
                  "The summary will appear after verified league data is available."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {data?.aiSummary?.isFallback
                  ? "Statistics-based fallback"
                  : "AI-generated"}{" "}
                · Official statistics are unchanged
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
              Recent evidence
            </p>
            <h2 className="mt-3 text-3xl font-black">Latest verified matches</h2>
          </div>
          <Link to="/matches" className="font-black text-amber-700 dark:text-amber-300">
            View match gallery →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.recentMatches?.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={match.screenshot.secureUrl}
                alt={match.matchCode}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <p className="font-black">{match.matchCode}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(match.matchDate).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
          {!data?.recentMatches?.length ? (
            <p className="col-span-full rounded-2xl border border-dashed p-6 text-slate-500">
              No verified matches are available yet.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
            Trusted workflow
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Official analytics begin with human verification.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {workflow.map(({ title, description, icon: Icon }, index) => (
            <article
              key={title}
              className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="absolute right-5 top-5 text-5xl font-black text-slate-100 dark:text-slate-800">
                0{index + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
