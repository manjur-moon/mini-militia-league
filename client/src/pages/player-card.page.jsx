import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { LeaguePlayerCard } from "@/features/player-cards/components/league-player-card.jsx";
import {
  copyText,
  downloadPlayerCardPng,
} from "@/features/player-cards/utils/player-card-actions.js";
import { getPlayerCard } from "@/services/player-card.service.js";

const PERIOD_OPTIONS = Object.freeze([
  { value: "all_time", label: "All time" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "season", label: "Active season" },
]);

export function PlayerCardPage() {
  const { playerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodType = searchParams.get("periodType") ?? "all_time";
  const [actionState, setActionState] = useState("");

  const cardQuery = useQuery({
    queryKey: ["player-card", playerId, periodType],
    queryFn: () => getPlayerCard(playerId, { periodType }),
  });

  const card = cardQuery.data?.data;
  useEffect(() => {
    if (!card) return undefined;
    const previousTitle = document.title;
    document.title = `${card.player.name} Player Card | Mini Militia League`;
    return () => {
      document.title = previousTitle;
    };
  }, [card]);

  async function runAction(name, action) {
    setActionState(name);
    try {
      await action();
      setActionState(`${name}-done`);
      window.setTimeout(() => setActionState(""), 1800);
    } catch (error) {
      setActionState("");
      window.alert(error.message);
    }
  }

  if (cardQuery.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <LoadingState title="Building player card" />
      </div>
    );
  }
  if (cardQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ErrorState
          title="Player card unavailable"
          description={cardQuery.error.message}
          onRetry={() => cardQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to={`/players/${card.player.playerId}`}
            className="font-bold text-amber-700 dark:text-amber-300"
          >
            ← Back to player profile
          </Link>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Shareable player card
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {card.player.name}’s league card
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Generated only from verified match statistics and the active rating formula.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
          Rating period
          <select
            value={periodType}
            onChange={(event) => setSearchParams({ periodType: event.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <LeaguePlayerCard card={card} />

        <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Card details
            </p>
            <h2 className="mt-2 text-2xl font-black">Ready to share</h2>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <dt className="text-xs font-black uppercase tracking-wider text-slate-500">
                Overall rating
              </dt>
              <dd className="mt-1 text-3xl font-black">{card.ratings.overall}</dd>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <dt className="text-xs font-black uppercase tracking-wider text-slate-500">
                Current title
              </dt>
              <dd className="mt-1 text-lg font-black">{card.title.name}</dd>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <dt className="text-xs font-black uppercase tracking-wider text-slate-500">
                Verified matches
              </dt>
              <dd className="mt-1 text-3xl font-black">{card.sampleSize}</dd>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <dt className="text-xs font-black uppercase tracking-wider text-slate-500">
                Rating status
              </dt>
              <dd className="mt-1 text-lg font-black">
                {card.minimumMatchesMet ? "Rank eligible" : "Provisional"}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                runAction("download", () =>
                  downloadPlayerCardPng({
                    imageUrl: card.urls.imageUrl,
                    playerId: card.player.playerId,
                  }),
                )
              }
              disabled={actionState === "download"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={18} />
              {actionState === "download" ? "Rendering…" : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={() => runAction("copy", () => copyText(card.urls.shareUrl))}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-black dark:border-slate-700"
            >
              {actionState === "copy-done" ? <Check size={18} /> : <Copy size={18} />}
              {actionState === "copy-done" ? "Link copied" : "Copy share link"}
            </button>
            {navigator.share ? (
              <button
                type="button"
                onClick={() =>
                  runAction("share", () =>
                    navigator.share({
                      title: `${card.player.name} Mini Militia Player Card`,
                      text: `${card.player.name} has an overall rating of ${card.ratings.overall}.`,
                      url: card.urls.shareUrl,
                    }),
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-black dark:border-slate-700"
              >
                <Share2 size={18} /> Share card
              </button>
            ) : null}
            <a
              href={card.urls.svgUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-black dark:border-slate-700"
            >
              <ExternalLink size={18} /> Open SVG
            </a>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Social shares use a public metadata page with Open Graph tags. The PNG
            export is rendered from the same server-generated SVG, so shared artwork and
            the web preview remain consistent.
          </p>
        </aside>
      </div>
    </section>
  );
}
