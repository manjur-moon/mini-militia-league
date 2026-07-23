import { CircleAlert } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || "The requested route failed."
    : error?.message || "An unexpected interface error occurred.";
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900 dark:bg-slate-900 sm:p-10">
        <CircleAlert className="mx-auto text-red-500" size={46} aria-hidden="true" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-red-500">
          Application error
        </p>
        <h1 className="mt-3 text-4xl font-black">Something went wrong</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">{message}</p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950"
        >
          Return home
        </Link>
      </section>
    </div>
  );
}
