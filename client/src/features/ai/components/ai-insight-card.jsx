import { Bot, DatabaseZap, Sparkles } from "lucide-react";

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h4>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li
            key={typeof item === "string" ? item : JSON.stringify(item)}
            className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
          >
            {typeof item === "string" ? item : item.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AIInsightCard({ insight, title = "AI insight", compact = false }) {
  if (!insight) return null;
  const content = insight.structuredContent ?? {};
  const headline = content.headline ?? content.title ?? title;
  const summary = content.summary ?? content.caption ?? insight.content;
  const primaryItems =
    content.highlights ?? content.strengths ?? content.turningPoints ?? content.bullets;
  const secondaryItems =
    content.watchNext ?? content.improvements ?? content.trainingFocus ?? [];

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm dark:border-violet-500/20 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-violet-50/80 px-5 py-4 dark:border-violet-500/15 dark:bg-violet-500/10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-violet-600 text-white">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              {title}
            </p>
            <p className="text-xs text-slate-500">{insight.label}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {insight.isFallback ? <DatabaseZap size={13} /> : <Bot size={13} />}
            {insight.isFallback
              ? "Statistics fallback"
              : (insight.model ?? insight.provider)}
          </span>
          {insight.cacheHit ? (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
              Cached
            </span>
          ) : null}
        </div>
      </div>
      <div className={`space-y-5 ${compact ? "p-5" : "p-6"}`}>
        <div>
          <h3 className={`${compact ? "text-xl" : "text-2xl"} font-black`}>
            {headline}
          </h3>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{summary}</p>
        </div>
        {!compact ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <ListSection title="Highlights" items={primaryItems} />
            <ListSection
              title={content.trainingFocus ? "Training focus" : "What to watch"}
              items={secondaryItems}
            />
          </div>
        ) : null}
        <p className="text-xs leading-5 text-slate-500">
          {content.disclaimer ??
            "AI-generated content is descriptive only and does not change official statistics."}
        </p>
      </div>
    </section>
  );
}
