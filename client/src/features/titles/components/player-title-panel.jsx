import { useQuery } from "@tanstack/react-query";
import { Award, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import {
  getPlayerCurrentTitle,
  getPlayerTitleHistory,
} from "@/services/title.service.js";
import { TitleBadge } from "./title-badge.jsx";

export function PlayerTitlePanel({ playerId }) {
  const currentQuery = useQuery({
    queryKey: ["player-current-title", playerId],
    queryFn: () => getPlayerCurrentTitle(playerId),
  });
  const historyQuery = useQuery({
    queryKey: ["player-title-history", playerId],
    queryFn: () => getPlayerTitleHistory(playerId, { page: 1, limit: 6 }),
  });

  if (currentQuery.isPending || historyQuery.isPending) {
    return <LoadingState title="Loading dynamic titles" />;
  }
  if (currentQuery.isError || historyQuery.isError) {
    return (
      <ErrorState
        title="Titles unavailable"
        description={(currentQuery.error ?? historyQuery.error).message}
        onRetry={() => {
          currentQuery.refetch();
          historyQuery.refetch();
        }}
      />
    );
  }

  const current = currentQuery.data.data.currentTitle;
  const history = historyQuery.data.data;

  return (
    <SectionCard
      title="Dynamic title"
      description="Temporary titles are recalculated from verified league performance"
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl bg-slate-950 p-6 text-white dark:bg-slate-800">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-300">
            <Award size={17} /> Current title
          </div>
          {current ? (
            <>
              <div className="mt-5">
                <TitleBadge title={current.title} current />
              </div>
              <p className="mt-4 text-sm text-slate-300">{current.title.description}</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                <Clock3 size={14} /> Expires{" "}
                {new Date(current.expiresAt).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="mt-5 text-slate-300">
              No active title. The next admin evaluation can assign one when a rule is
              met.
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-black">Award history</h3>
            <Link
              to="/titles"
              className="text-sm font-black text-amber-700 dark:text-amber-300"
            >
              View title rules →
            </Link>
          </div>
          <div className="mt-3 grid gap-3">
            {history.length ? (
              history.map((award) => (
                <article
                  key={award.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div>
                    <TitleBadge title={award.title} current={award.isCurrent} />
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {award.period.key} · {award.status}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(award.awardedAt).toLocaleDateString()}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                No dynamic-title awards yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
