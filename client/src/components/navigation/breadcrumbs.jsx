import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const LABEL_OVERRIDES = Object.freeze({
  admin: "Admin",
  moderator: "Moderator",
  player: "Player",
  users: "Users",
  account: "Account",
});

function formatSegment(segment) {
  return (
    LABEL_OVERRIDES[segment] ??
    segment.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-slate-500 dark:text-slate-400">
        <li className="shrink-0">
          <Link
            to="/"
            className="inline-flex items-center rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Home"
          >
            <Home size={15} aria-hidden="true" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          return (
            <li key={to} className="flex min-w-0 items-center gap-1">
              <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
              {isLast ? (
                <span
                  className="truncate font-bold text-slate-800 dark:text-slate-200"
                  aria-current="page"
                >
                  {formatSegment(segment)}
                </span>
              ) : (
                <Link
                  to={to}
                  className="truncate rounded-md px-1.5 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {formatSegment(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
