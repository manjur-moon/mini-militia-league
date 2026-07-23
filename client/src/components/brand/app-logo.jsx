import { APP_NAME } from "@mini-militia/shared";
import { Crosshair } from "lucide-react";
import { Link } from "react-router-dom";

export function AppLogo({ compact = false, to = "/" }) {
  return (
    <Link
      to={to}
      className="group inline-flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
      aria-label={`${APP_NAME} home`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition group-hover:rotate-3">
        <Crosshair size={22} strokeWidth={2.5} aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-black tracking-tight sm:text-base">
            Mini Militia League
          </span>
          <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Analytics Platform
          </span>
        </span>
      ) : null}
    </Link>
  );
}
