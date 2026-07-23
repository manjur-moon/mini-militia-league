export function SectionCard({ title, description, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}
    >
      {title || description || action ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-black">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
