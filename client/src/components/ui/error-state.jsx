import { CircleAlert } from "lucide-react";

export function ErrorState({ title = "Unable to load data", description, onRetry }) {
  return (
    <div
      className="rounded-lg border border-[#F1BBBC] bg-[#FDF3F4] p-8 text-center dark:border-red-900 dark:bg-red-950/30"
      role="alert"
    >
      <CircleAlert
        className="mx-auto text-[#D13438] dark:text-red-400"
        size={32}
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold text-[#201F1E] dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#A4262C]/90 dark:text-red-300/80">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-md bg-[#D13438] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A4262C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D13438]"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
