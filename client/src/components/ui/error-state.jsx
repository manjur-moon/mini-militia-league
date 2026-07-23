import { CircleAlert } from "lucide-react";

export function ErrorState({ title = "Unable to load data", description, onRetry }) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30"
      role="alert"
    >
      <CircleAlert
        className="mx-auto text-red-600 dark:text-red-400"
        size={34}
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700/80 dark:text-red-300/80">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
