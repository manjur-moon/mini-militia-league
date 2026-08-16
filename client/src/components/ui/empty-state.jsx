import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#C8C6C4] bg-[#FAF9F8]/60 p-9 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#F3F2F1] text-[#605E5C] dark:bg-slate-800 dark:text-slate-400">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[#201F1E] dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#605E5C] dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
