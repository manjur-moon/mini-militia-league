const styles = Object.freeze({
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  upcoming: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  completed: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  archived: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
});

export function SeasonStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
