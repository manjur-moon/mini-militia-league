export function AuthFormShell({ title, description, footer, children }) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-9">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
        Secure league access
      </p>
      <h1 className="mt-4 text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">{description}</p>
      <div className="mt-8">{children}</div>
      <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-400">
        {footer}
      </p>
    </section>
  );
}
