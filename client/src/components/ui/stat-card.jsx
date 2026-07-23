export function StatCard({ label, value, helper, icon: Icon, trend }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        {Icon ? (
          <span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Icon size={21} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400">{helper}</span>
        {trend ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {trend}
          </span>
        ) : null}
      </div>
    </article>
  );
}
