export function TitleBadge({ title, current = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-black ${current ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
    >
      <span aria-hidden="true">{title.icon ?? "◆"}</span>
      {title.name}
    </span>
  );
}
