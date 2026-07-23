export function PageHeader({ eyebrow, title, description, action, icon: Icon }) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          {Icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Icon size={23} aria-hidden="true" />
            </span>
          ) : null}
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </div>
        {description ? (
          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
