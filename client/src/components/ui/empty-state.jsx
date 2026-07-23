import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-9 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
