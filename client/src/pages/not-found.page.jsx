import { ArrowLeft, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500 text-slate-950">
          <Crosshair size={32} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
          404 target missed
        </p>
        <h1 className="mt-3 text-4xl font-black">Page not found</h1>
        <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
          The requested route does not exist or has not been released yet.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 hover:bg-amber-400"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Return home
        </Link>
      </section>
    </div>
  );
}
