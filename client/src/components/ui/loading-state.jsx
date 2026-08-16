import { LoaderCircle } from "lucide-react";

export function LoadingState({
  title = "Loading",
  description = "Please wait while the latest data is prepared.",
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-[#E1DFDD] bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="animate-spin text-[#0078D4] dark:text-blue-400"
        size={32}
        aria-hidden="true"
      />
      <p className="mt-4 font-semibold text-[#201F1E] dark:text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#605E5C] dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
