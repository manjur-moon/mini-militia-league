import { LoaderCircle } from "lucide-react";

export function LoadingState({
  title = "Loading",
  description = "Please wait while the latest data is prepared.",
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="animate-spin text-amber-500"
        size={34}
        aria-hidden="true"
      />
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
